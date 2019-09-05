import store from '../store'
import axios from '../utils/mockAxios.js'
import {fetchCart} from './fetchCart'

const requestDeleteCart = () => {
  return {
    type: 'REQUEST_DELETE_CART'
  }
};

const receiveDeleteCart = () => {
  return {
    type: 'RECEIVE_DELETE_CART'
  }
};

export const deleteCart = (key) => {
  return dispatch => {
    dispatch(requestDeleteCart());
    return axios.deleteAll('cart')
      .then(response => response)
      .then(json => {
        dispatch(receiveDeleteCart());
        dispatch(fetchCart());
      });
  }
};
