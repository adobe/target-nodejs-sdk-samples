import React, { useEffect } from 'react';
import Layout from '../../components/MyLayout';
import fetch from 'isomorphic-unfetch';
import Target from '../../helpers/target-client-side';

const Post = props => {
  useEffect(() => {
    const pathname = window.location.pathname;
    const viewName = 'show#' + pathname.substr(pathname.lastIndexOf('/') + 1);
    Target.triggerView(viewName);
  });

  return (
    <Layout>
      <h1>{props.show.name}</h1>
      <p>{props.show.summary.replace(/<[/]?p>/g, '')}</p>
      <img src={props.show.image.medium} />
    </Layout>
  );
};

Post.getInitialProps = async function(context) {
  const { id } = context.query;
  const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
  const show = await res.json();

  console.log(`Fetched show: ${show.name}`);

  return { show };
};

export default Post;
