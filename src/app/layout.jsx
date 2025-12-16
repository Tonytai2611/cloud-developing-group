import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import '../index.css'

export default function Layout({ children }) {
  return (
    <div className="page-pad">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
