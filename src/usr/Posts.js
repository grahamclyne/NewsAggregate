import React, { Component } from "react";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import ReactDOM from "react-dom";
import('bootstrap/dist/css/bootstrap.min.css');
import { CSSTransitionGroup } from 'react-transition-group'; // ES6
import('./Posts.css');
import('../../.well-known/acme-challenge/pop.js');


class KeywordList extends React.Component {

  handleDelete(id) {
    this.props.handleDelete(id);
  }

  render() {
    return (
      <ul className='list-inline' style={{ 'listStyle': 'none' }}>
        {this.props.items.map(item => (
          <li className='list-inline-item' key={item}>{item}<Button variant='link' onClick={this.handleDelete.bind(this, item)}>&times;</Button></li>
        ))}
      </ul>
    );
  }
}



class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      endpoint: "wss://grahamclyne.com",
      value: '',
      keys: []
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.delete = this.delete.bind(this);
  }
  delete(id) {
    this.setState(prevState => ({
      keys: prevState.keys.filter(el => el != id)
    }));
  }
  handleChange(event) {
    this.setState({ value: event.target.value });
    console.log(this.state.value)
  }

  handleSubmit(event) {
    event.preventDefault();
    var temp = this.state.keys;
    temp.push(this.state.value);
    console.log('submitted: ' + this.state.value)
    this.setState({ keys: temp, value: '' })
    console.log(this.state.keys)
  }

  componentDidMount() {
    const ws = new WebSocket(this.state.endpoint)
    //push newly received message onto posts array
    ws.onmessage = event => {
      var temp = this.state.posts;
      var post = JSON.parse(event.data)
      try {
        post.linkshort = post.link.split('www.')[1].split('.com')[0]
      }
      catch (err) { post.linkshort = post.link }
      post.pubdate = new Date(post.pubdate).toLocaleTimeString([], { month: "short", day: "2-digit", hour: '2-digit', minute: '2-digit', second: '2-digit' })
      temp.unshift(post);
      if (temp.length > 5) {
        temp.pop();
      }
      this.setState({ posts: temp })
    }
  }
  render() {
    const posts = this.state.posts.map(post => (
      <Row key={post.title}>

        <Container className='post'>
          <Row >
            {post.title}
          </Row>
          <Row>
            <Col><a href={post.link}>Source: {post.linkshort}</a></Col>
            <Col><p className='text-right'>{post.pubdate}</p></Col>
          </Row>
        </Container>
      </Row>
    ));
    return (
      <Container>
        <h2 className="text-center">A rolling version of a news feed</h2>
        <Form onSubmit={this.handleSubmit}>
          <Form.Control placeholder="Enter search keywords" id='keyform'
            value={this.state.value} onChange={this.handleChange} >
          </Form.Control>
        </Form>
        <ul className='list-inline'>
          <KeywordList items={this.state.keys} handleDelete={this.delete.bind(this)} />
        </ul>
        <Container>
          <CSSTransitionGroup
            transitionName="example"
            transitionEnterTimeout={400}
            transitionLeaveTimeout={400}>
            {posts}
          </CSSTransitionGroup>
        </Container>
      </Container>
    );
  }
}

ReactDOM.render(
  <Posts />,
  document.getElementById('root')
);
