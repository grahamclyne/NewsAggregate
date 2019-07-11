import React, { Component, useState } from "react";
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
      console.log('receiving' + event)
      var temp = this.state.posts;
      temp.unshift(event.data);
      if (temp.length > 5) {
        temp.pop();
      }
      this.setState({ posts: temp })
    }
  }
  render() {
    const posts = this.state.posts.map(post => (
      <li key={post}>
        <h2 className='post' key={post}>
          {post}
        </h2>
      </li>));

    return (
      <ul style={{ 'listStyleType': 'none' }}>
        <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}>
           {posts}
        </CSSTransitionGroup>
      </ul>
    );
  }
}

ReactDOM.render(
  <Posts />,
  document.getElementById('root')
);
