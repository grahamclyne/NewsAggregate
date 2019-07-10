import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Container } from 'react-bootstrap';
import('bootstrap/dist/css/bootstrap.min.css');
var CSSTransitionGroup = require('react-transition-group/CSSTransitionGroup') // ES5 with npm
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
      temp.unshift(event.data);
      if (temp.length > 5) {
        temp.pop();
      }
      this.setState({ posts: temp })
    }
  }
  render() {
    return (<Container >

      <ul style={{ 'list-style-type': 'none' }}>
        <CSSTransitionGroup
          transitionName="example"
          transitionEnterTimeout={700}
          transitionLeaveTimeout={700}
          transitionAppearTimeout={500}
          transitionAppear={true}>
          {this.state.posts.map(post => (<li>
            <h2  className='post' key={post}>{post}</h2>
          </li>))}
        </CSSTransitionGroup>
      </ul>

    </Container>);
  }
}

ReactDOM.render(
  <Posts />,
  document.getElementById('root')
);
