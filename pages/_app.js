import '../styles/globals.css'
import Layout from '../components/Layout'

export default function App({ Component, pageProps }) {
  const title = Component.pageTitle || 'NimblScale'
  return (
    <Layout title={title}>
      <Component {...pageProps} />
    </Layout>
  )
}
