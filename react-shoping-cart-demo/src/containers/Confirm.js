import React, { Component } from 'react'
import Helmet from "react-helmet"
import { generate } from 'randomstring'

class Confirm extends Component {

  componentDidMount() {
    //digitalData.page.pageInfo.pageID = "order-confirm-page";
    //digitalData.page.pageInfo.pageName = "ACS Demo - Order Confirmation Page";
  }

  render() {
    return (
      <div>
        <Helmet title="Order Confirmation"/>
        <section className="section">
          <div className="container">
            <div className="heading">
              <h1 className="title">Order Confirmation</h1>
            </div>
            <p>Thank you for your order.</p>

            <h2><span className="badge badge-success">Order Number: {generate(10)}</span></h2>
          </div>
        </section>
      </div>
    )
  }
}

export default (Confirm)
