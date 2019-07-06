import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Container } from 'react-bootstrap';

class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: [] };
    fetch('http://localhost:3000/posts')
      .then(response => response.json())
      .then(posts => (this.setState({posts})))
  } 
  render() {
    return (<Container>
      <ul>
        {this.state.posts.map(post => (<li key={post.title}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>    
        </li>))}
      </ul>
      
    </Container>);
  }
}

ReactDOM.render(
    <Posts />,
    document.getElementById('root')
);
