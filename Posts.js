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
      this.setState({posts: temp})
    }
  }
  render() {
    return (<Container >
              <CSSTransitionGroup 
          transitionName="example" 
          transitionEnterTimeout={700} 
          transitionLeaveTimeout={700}>
      <ul style={{ 'list-style-type': 'none' }}>

                  {this.state.posts.map(post => (<li>
          <p class='border rounded' className='post' key={post}>{post}</p>
                  </li>))}

      </ul>
          </CSSTransitionGroup>

    </Container>);
  }
}

ReactDOM.render(
  <Posts />,
  document.getElementById('root')
);
