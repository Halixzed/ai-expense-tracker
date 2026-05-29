import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-2_SyAcNA1HE',
      userPoolClientId: '6n64vmrrbrcrrdqlj4jesqtcth',
      loginWith: {
        oauth: {
          domain: 'expense-tracker-auth.auth.eu-west-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [
            'http://localhost:5173/callback',
            'https://d21zqbe3j8g9m5.cloudfront.net/callback'
          ],
          redirectSignOut: [
            'http://localhost:5173',
            'https://d21zqbe3j8g9m5.cloudfront.net'
          ],
          responseType: 'code'
        }
      }
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
