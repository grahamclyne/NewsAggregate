import React, { Component} from "react";
import {Container,Row,Col} from 'react-bootstrap';
import ReactDOM from "react-dom";
import('bootstrap/dist/css/bootstrap.min.css');
import { CSSTransitionGroup} from 'react-transition-group'; // ES6
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
      post.linkshort = post.link.split('www.')[1].split('.com')[0]
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
          {post.title}</Row>
          <Row>
        <a href={post.link}>Source: {post.linkshort}</a>
        <p className='text-right'>Time: {post.date}</p>
        </Row>
        </Container>
      </Row>));

    return (
      <Container style={{ 'listStyleType': 'none' }}>
        <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}>
           {posts}
        </CSSTransitionGroup>
      </Container>
    );
  }
}

ReactDOM.render(
  <Posts />,
  document.getElementById('root')
);
