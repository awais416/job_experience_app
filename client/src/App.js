import './App.css'
import React, { Fragment, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Landing from './components/layout/Landing'
import Register from './components/layout/Register'
import Login from './components/layout/Login'
import Alerts from './components/layout/Alert'
import { loadUser } from './actions/auth'
// Redux
import { Provider } from 'react-redux'
import store from './store'
import setAuthToken from './utils/setAuthToken'

if (localStorage.token) {
  setAuthToken(localStorage.token)
}
const App = () => {
  // running useEffect only once when you add empty parentheseis at the end
  useEffect(() => {
    store.dispatch(loadUser())
  }, [])
  return (
    <Provider store={store}>
      <Router>
        <Fragment>
          <Navbar />
          <Alerts />
          <Routes>
            <Route exact path="/" element={<Landing />} />
            <Route exact path="/register" element={<Register />} />
            <Route exact path="/login" element={<Login />} />
          </Routes>
        </Fragment>
      </Router>
    </Provider>
  )
}
export default App
