import React, { Component } from "react";
import { Container, Row, Col } from 'react-bootstrap';
import ReactDOM from "react-dom";
import('bootstrap/dist/css/bootstrap.min.css');
import { CSSTransitionGroup } from 'react-transition-group'; // ES6
import('./Posts.css');

class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      endpoint: "ws://localhost:3000/",
    };
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
      post.pubdate = new Date(post.pubdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      temp.unshift(post);
      if (temp.length > 5) {
        temp.pop();
      }
      this.setState({ posts: temp })
    }
  }
  render() {
    const posts = this.state.posts.map(post => (
      <Row key={post.title} >
        <Container className='post'>
          <Row >
            {post.title}
          </Row>
          <Row>
            <Col><a href={post.link}>Source: {post.linkshort}</a></Col>
            <Col><p className='text-right'>Time: {post.pubdate}</p></Col>
          </Row>
        </Container>
      </Row>));

    return (

      <Container>
            <h2 className="text-center">A rolling version of a news feed</h2>
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
