import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Container } from 'react-bootstrap';
import('bootstrap/dist/css/bootstrap.min.css');

const divStyle = {
  padding:'10px',
  'margin-left':'10%',
  'margin-right':'10%',
  'margin-bottom':'0%'
};


class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = { posts: [] };
    fetch('http://localhost:3000/posts')
      .then(response => response.json())
      .then(posts => (this.setState({posts})))
  } 
  render() {
    return (<Container >
      <ul style={{'list-style-type':'none'}}>
        {this.state.posts.map(post => (<li>
          <h2 class='border rounded' style={divStyle}>{post.title}</h2>
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
