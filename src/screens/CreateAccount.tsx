import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, StyleSheet, TextInput } from "react-native";
import * as Clipboard from 'expo-clipboard'
import Checkbox from 'expo-checkbox';

import { Text, View } from "../components/Themed";
import useStore from "../state/useStore";
import Button from "../components/form/Button";
import { isIos, keyboardAvoidBehavior, keyboardOffset, window } from "../constants/Layout";
import Col from "../components/spacing/Col";
import H3 from "../components/text/H3";
import Row from "../components/spacing/Row";
import { ONE_SECOND } from "../util/time";
import { uq_purple } from "../constants/Colors";

type CreateAccountStep = 'email' | 'otp' | 'invite' | 'success'

interface UserInfo {
  "pat_p": string             // @p (no ~) and subdomain
  "lus_code": string          //
  "owner": string             //
  "pill": "uqbar" | "normal"  //
  "created_at": string        // timestamptz
  "domain": string            // hosted pier domain
}

interface AccountDetails {
  ship: string
  url: string
  code: string
}

const ROOT_URL = 'https://bfjkflmsowbwosbfrqvg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmamtmbG1zb3did29zYmZycXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU4OTExNjEsImV4cCI6MTk5MTQ2NzE2MX0.9Lu6CJfYbJ9cDdBp0wlAx54pSmoJclhxDoE4nxlrzH4'

export default function CreateAccountScreen({ method, goBack } : { method: 'login' | 'create'; goBack: () => void }) {
  const { addShip } = useStore();
  const emailInputRef = useRef<TextInput | null>(null)
  const otpInputRefs = useRef<{ [box: string]: TextInput | null }>({})
  const inviteInputRef = useRef<TextInput | null>(null)
  const [step, setStep] = useState<CreateAccountStep>('email')
  const [loading, setLoading] = useState('')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [invite, setInvite] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [authCookie, setAuthCookie] = useState('')
  const [termsChecked, setChecked] = useState(false)

  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>()

  const { height } = window

  const onBack = useCallback(() => {
    if (step === 'email') {
      goBack()
    } else if (step === 'otp') {
      setStep('email')
    } else if (step === 'invite') {
      setStep('otp')
    }
  }, [step, goBack])

  const changeEmail = useCallback((text: string) => {
    setEmail(text)
    setEmailError('')
  }, [])

  const changeOtp = useCallback((text: string) => {
    setOtpError('')
    if (text.length === 6) {
      Keyboard.dismiss()
      return setOtp(text)
    }

    if (text && Number(text) >= 0 && Number(text) <= 9) {
      if (otp.length < 5) {
        otpInputRefs.current?.[`box${otp.length + 1}`]?.focus()
      } else if (otp.length >= 5) {
        Keyboard.dismiss()
      }
      setOtp(otp + Number(text))
    }
  }, [otp])

  const backspace = useCallback(({ nativeEvent: { key } }: any) => {
    if (key === 'Backspace' && otp.length) {
      otpInputRefs.current?.[`box${otp.length - 1}`]?.focus()
      setOtp(otp.slice(0, -1))
    }
  }, [otp])

  const copyInfo = useCallback(() => {
    if (accountDetails) {
      Clipboard.setStringAsync(
        `Username: ${accountDetails.url}, URL: ${accountDetails.url}, Password: ${accountDetails.code}`
      )
    }
  }, [accountDetails])

  const continueToApp = useCallback(() => {
    if (accountDetails) {
      addShip({ ship: accountDetails.ship, shipUrl: accountDetails.url, authCookie })
    }
  }, [accountDetails, authCookie])

  const changeInvite = useCallback((text: string) => {
    setInvite(text)
    setInviteError('')
  }, [])

  const submitEmail = useCallback(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setEmailError('Please enter a valid email')
    } else if (!termsChecked) {
      return setEmailError('Please consent to the terms')
    }

    setLoading('Sending confirmation...')
    try {
      await fetch(`${ROOT_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "apikey": `${ANON_KEY}`,
        },
        body: JSON.stringify({
          "email": email
        })
      })

      setStep('otp')
    } catch {
      setEmailError('Something went wrong, please check your email and try again')
    }
    setLoading('')
  }, [email, termsChecked])

  const submitOtp = useCallback(async () => {
    if (otp.length < 6) {
      return setOtpError('Must be 6 digits')
    }

    setLoading('Confirming email...')
    try {
      const result = await fetch(`${ROOT_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "apikey": `${ANON_KEY}`,
        },
        body: JSON.stringify({
          "email": email,            // Same email from /v1/otp
          "token": otp,            // OTP pasted from email
          "type": "magiclink",        //
          "gotrue_meta_security": {}  // Always empty
        })
      })

      const {
        access_token,   // Use in future request headers.
        refresh_token,  // Useless.
        token_type,     //
        expires_in,     // Seconds til access_token expires.
        user,           // Internal user data.
      } = await result.json()
      
      if (method === 'login') {
        const userDataResult = await fetch(`${ROOT_URL}/rest/v1/planets?select=*`, {
          method: 'GET',
          headers: {
            "apikey": `${ANON_KEY}`,
            "Authorization": `Bearer ${access_token}`,
          }
        })
  
        const userInfo: UserInfo[] = await userDataResult.json()
  
        if (userInfo && userInfo[0] && userInfo[0].pat_p) {
          const ship = userInfo[0].pat_p
          const url = `https://${ship}.${userInfo[0].domain}`
          const code = userInfo[0]['lus_code']
  
          const formBody = `${encodeURIComponent('password')}=${encodeURIComponent(code)}`
          
          const loginResult = await fetch(`${url}/~/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formBody
          })
  
          const authCookieHeader = loginResult.headers.get('set-cookie') || ''
          setAuthCookie(authCookieHeader || '')
          // if (!authCookieHeader) {
          //   console.log('auth header error')
          //   return setInviteError('Something went wrong, please check the invite code and try again');
          // }
          
          setAccountDetails({ ship, url, code })
  
          setStep('success')
        }
      } else {
        setAccessToken(access_token)
        setStep('invite')
      }
      setOtp('')
    } catch {
      setOtpError('Something went wrong, please check the code and try again')
    }
    setLoading('')
  }, [otp, method])

  const submitInvite = useCallback(async () => {
    if (!(/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(invite))) {
      return setInviteError('Must be in xxxx-xxxx-xxxx format')
    }

    setLoading('Generating account...')
    try {
      const inviteRedemptionResult = await fetch(`${ROOT_URL}/rest/v1/rpc/redeem_invite_code`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "apikey": `${ANON_KEY}`,
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          "invite_code": invite
        })
      })

      const username = await inviteRedemptionResult.text()

      if (!username) {
        setLoading('')
        return setInviteError('That invite code has already been claimed')
      }

      const userDataResult = await fetch(`${ROOT_URL}/rest/v1/planets?select=*`, {
        method: 'GET',
        headers: {
          "apikey": `${ANON_KEY}`,
          "Authorization": `Bearer ${accessToken}`,
        }
      })

      const userInfo: UserInfo[] = await userDataResult.json()

      if (!userInfo || !userInfo[0] || !userInfo[0].pat_p) {
        setLoading('')
        return setInviteError('Account info not found')
      }

      const ship = userInfo[0].pat_p
      const url = `https://${ship}.${userInfo[0].domain}`
      const code = userInfo[0]['lus_code']

      const formBody = `${encodeURIComponent('password')}=${encodeURIComponent(code)}`
      const loginCheckStart = Date.now()
      
      const loginResult: any = await new Promise((resolve, reject) => {
        const loginInterval = setInterval(() => {
          fetch(`${url}/~/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formBody
          })
            .then((result) => {
              clearInterval(loginInterval)
              resolve(result)
            })
            .catch(() => {
              console.log('failed once', (Date.now() - loginCheckStart))
              if ((Date.now() - loginCheckStart) > (20 * ONE_SECOND)) {
                reject('Login timed out')
              }
            })
        }, ONE_SECOND)
      })
      
      const authCookieHeader = loginResult.headers.get('set-cookie') || ''
      setAuthCookie(authCookieHeader || '')
      // if (!authCookieHeader) {
      //   console.log('auth header error')
      //   return setInviteError('Something went wrong, please check the invite code and try again');
      // }
      
      setAccountDetails({ ship, url, code })
      setStep('success')
    } catch (err) {
      console.log('error:', err)
      setInviteError('Something went wrong, please check the invite code and try again')
    }
    setLoading('')
  }, [invite, accessToken])

  const content = (
    loading ? (
      <Col>
        <Text style={{ marginTop: 24, fontSize: 18, fontWeight: '600', alignSelf: 'center', textAlign: 'center' }}>{loading}</Text>
        <ActivityIndicator style={{ marginTop: 12 }} size='large' />
      </Col>
    ) : step === 'email' ? (
      <Col>
        <Text style={styles.label}>Please enter your email:</Text>
        <TextInput
          ref={emailInputRef}
          autoFocus
          value={email}
          onChangeText={changeEmail}
          style={[styles.input, { fontSize: 16 }]}
          placeholder='Email'
          autoComplete='off'
          autoCapitalize="none"
          spellCheck={false}
          keyboardType='email-address'
        />
        <Text style={styles.error}>{emailError}</Text>
        <Row style={{ marginHorizontal: '10%', marginVertical: 8 }}>
          <Checkbox
            style={styles.checkbox}
            value={termsChecked}
            onValueChange={setChecked}
            color={termsChecked ? uq_purple : undefined}
          />
          <Text style={styles.agreement}>I agree to receive critical updates and support emails regarding my account</Text>
        </Row>

        <Button style={styles.button} onPress={submitEmail} title='Submit' />
        <Button style={styles.button} onPress={onBack} title='Back' />
      </Col>
    ) : step === 'otp' ? (
      <Col>
        <Text style={styles.label}>Enter the 6-digit code sent to your email:</Text>
        <Row style={styles.otpInput}>
          {[0,1,2,3,4,5].map((num) => <TextInput key={num}
            textContentType='oneTimeCode'
            maxLength={isIos && num === 0 ? 6 : 1}
            value={otp[num]}
            onKeyPress={backspace}
            onChangeText={changeOtp}
            keyboardType='phone-pad'
            style={styles.otpBox}
            ref={c => otpInputRefs.current[`box${num}`] = c} autoFocus={num === 0}
          />)}
        </Row>

        <Text style={styles.error}>{otpError}</Text>
        <Button style={styles.button} onPress={submitOtp} title='Submit' />
        <Button style={styles.button} onPress={onBack} title='Back' />
      </Col>
    ) : step === 'invite' ? (
      <Col>
        <Text style={styles.label}>Enter your 12-digit invite code:</Text>
        <TextInput
          ref={inviteInputRef}
          autoFocus
          value={invite}
          onChangeText={changeInvite}
          style={styles.input}
          placeholder='Invite code'
          autoComplete='off'
          autoCapitalize="none"
          spellCheck={false}
        />
        <Text style={styles.error}>{inviteError}</Text>
        <Button style={styles.button} onPress={submitInvite} title='Submit' />
        <Button style={styles.button} onPress={onBack} title='Back' />
      </Col>
    ) : accountDetails ? (
      <Col style={{ marginTop: 24 }}>
        <Text style={styles.accountDetails}>Please screenshot or copy this information</Text>
        <Col style={{ marginTop: 8 }}>
          <Text style={styles.accountDetails}>Username (ship):</Text>
          <Text style={[styles.accountDetails, { marginTop: 4 }]} mono>{accountDetails.ship}</Text>
        </Col>
        <Col style={{ marginTop: 8 }}>
          <Text style={styles.accountDetails}>URL:</Text>
          <Text style={[styles.accountDetails, { marginTop: 4 }]} mono>{accountDetails.url}</Text>
        </Col>
        <Col style={{ marginTop: 8 }}>
          <Text style={styles.accountDetails}>Password:</Text>
          <Text style={[styles.accountDetails, { marginTop: 4 }]} mono>{accountDetails.code}</Text>
        </Col>
        <Button style={styles.button} onPress={copyInfo} title='Copy info to clipboard' iconName="copy-outline" />
        <Button style={styles.button} onPress={continueToApp} title='Take me to the app' />
      </Col>
    ) : null
  )

  return (
    <KeyboardAvoidingView behavior={keyboardAvoidBehavior} style={styles.view} keyboardVerticalOffset={keyboardOffset}>
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/pongo-logo.png')}
        />
        <Text style={styles.redHorizon}>Hosting provided by Red Horizon</Text>
        <Text style={styles.welcome}>{step === 'success' ? 'Account Info' : method === 'login' ? 'Login' : 'Create Account'}</Text>
      </View>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  view: {
    padding: 20,
    height: '100%',
  },
  logo: {
    height: 120,
    width: 120,
  },
  redHorizon: {
    marginTop: 8,
    fontSize: 12,
  },
  welcome: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: "600",
  },
  checkbox: {
    marginRight: 8,
  },
  agreement: {
    fontSize: 12,
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    alignSelf: 'center',
    maxWidth: '90%'
  },
  input: {
    width: '80%',
    marginHorizontal: '10%',
    height: 40,
    marginTop: 4,
    borderWidth: 1,
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 4,
    borderColor: 'gray',
    fontSize: 18,
  },
  otpInput: {
    marginTop: 8,
    justifyContent: 'space-around'
  },
  otpBox: {
    padding: 8,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    width: 36,
    fontSize: 18,
    textAlign: 'center'
  },
  error: {
    color: 'red',
    marginTop: 2,
    fontSize: 14,
    marginLeft: '10%',
    width: '80%',
  },
  button: {
    marginTop: 16,
  },
  accountDetails: {
    fontSize: 15,
  }
});
