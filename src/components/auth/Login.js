import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getPCN } from '../../utils/classes'
import { links } from '../../utils/nav'
import specLogo from '../../svgs/spec-logo'
import TextInput from '../shared/inputs/TextInput'
import { isEmail } from '../../utils/validators'
import { noop } from '../../utils/nodash'
import githubIcon from '../../svgs/github'
import discordIcon from '../../svgs/discord'
import twitterIcon from '../../svgs/twitter'
import api from '../../utils/api'
import { saveAuthedUser } from '../../electronClient'
import constants from '../../constants'
import spinner from '../../svgs/chasing-tail-spinner'
import loginBlur from '../../svgs/login-blur'
import arrowLong from '../../svgs/arrow-long'
import LoginAnimation from './LoginAnimation'

const className = 'login'
const pcn = getPCN(className)

const statuses = {
    DEFAULT: 0,
    AUTHORIZING: 1,
    FAILED: 2,
}

function Login(props) {
    const { onSuccess = noop } = props
    const emailRef = useRef()
    const passwordRef = useRef()
    const [status, setStatus] = useState(statuses.DEFAULT)
    const hasFocused = useRef(false)
    const loginTimer = useRef(null)

    const setEmailRef = useCallback((ref) => {
        if (!ref) return
        emailRef.current = ref

        if (!hasFocused.current) {
            hasFocused.current = true
            setTimeout(() => {
                emailRef.current?.focus()
            }, 50)
        }
    }, [])

    const signIn = useCallback(async () => {
        const email = emailRef.current.getValue()
        const password = passwordRef.current.getValue()

        const { ok, headers, timer } = await api.core.login({ email, password })
        if (!ok) {
            setStatus(statuses.FAILED)
            return
        }

        const sessionToken = (
            headers.get(constants.USER_AUTH_HEADER_NAME) || 
            headers.get(constants.USER_AUTH_HEADER_NAME.toLowerCase())
        )
        if (!sessionToken) {
            setStatus(statuses.FAILED)
            return
        }

        const error = await saveAuthedUser(email, sessionToken)
        if (error) {
            setStatus(statuses.FAILED)
            return
        }

        timer.onDone(onSuccess)
    }, [onSuccess])

    const onSignIn = useCallback(() => {
        if (status === statuses.AUTHORIZING) return
        const emailIsValid= emailRef.current.validate()
        const passwordIsValid= passwordRef.current.validate()
        if (!emailIsValid || !passwordIsValid) return
        setStatus(statuses.AUTHORIZING)
    }, [status])

    useEffect(() => {
        if (status === statuses.AUTHORIZING) {
            signIn()
        }
    }, [status, signIn])

    const renderAuthPanelHeader = useCallback(() => (
        <div className={pcn('__auth-panel-header')}>
            <a
                href={links.SPEC_HOME_PAGE}
                target="_blank"
                className={pcn('__auth-panel-header-logo')}
                dangerouslySetInnerHTML={{ __html: specLogo }}>
            </a>
        </div>
    ), [])

    const renderAuthPanelBody = useCallback(() => (
        <div className={pcn('__auth-panel-body')}>
            <div className={pcn('__auth-panel-body-liner')}>
                <a
                    href={links.INTRO_BLOG_POST}
                    target="_blank"
                    className={pcn('__auth-panel-announcement-label')}>
                    <div><span>Live</span></div>
                    <span>Read our beta launch post</span>
                    <span dangerouslySetInnerHTML={{ __html: arrowLong }}></span>
                </a>
                <div className={pcn('__auth-panel-title-section')}>
                    <div className={pcn('__auth-panel-title')}>
                        Welcome to Spec
                    </div>
                    <div className={pcn('__auth-panel-subtitle')}>
                        Sign in to your account
                    </div>
                </div>
                <div className={pcn('__auth-panel-form')}>
                    <TextInput
                        className={pcn('__auth-panel-form-input', '__auth-panel-form-input--email')}
                        placeholder='you@example.com'
                        isRequired={true}
                        spellCheck={false}
                        onChange={() => {
                            if (status === statuses.FAILED) {
                                setStatus(statuses.DEFAULT)
                            }
                        }}
                        validator={isEmail}
                        ref={setEmailRef}
                    />
                    <TextInput
                        type='password'
                        className={pcn('__auth-panel-form-input', '__auth-panel-form-input--password')}
                        placeholder='••••••••'
                        isRequired={true}
                        spellCheck={false}
                        onChange={() => {
                            if (status === statuses.FAILED) {
                                setStatus(statuses.DEFAULT)
                            }
                        }}
                        onEnter={onSignIn}
                        ref={passwordRef}
                    />
                    <div className={pcn(
                        '__auth-panel-form-action', 
                        status === statuses.AUTHORIZING ? '__auth-panel-form-action--spinning' : '',
                        status === statuses.FAILED ? '__auth-panel-form-action--failed' : ''
                    )}>
                        <button onClick={onSignIn}>
                            { status === statuses.AUTHORIZING
                                ? <span className='svg-spinner svg-spinner--chasing-tail' dangerouslySetInnerHTML={{ __html: spinner }}></span>
                                : <span>Sign in</span>
                            }
                        </button>
                    </div>
                </div>
                <div className={pcn('__auth-panel-footer')}>
                    <span>
                        Don't have an account?&nbsp;
                        <a href={links.REQUEST_EARLY_ACCESS} target='_blank'>
                            Request early access
                        </a>
                    </span>
                </div>
            </div>
        </div>
    ), [onSignIn, status])

    const renderAnimation = useCallback(() => (
        <div className={pcn('__animation')}>
            <LoginAnimation/>
        </div>
    ), [])

    const renderHeaderIconLinks = useCallback(() => (
        <div className={pcn('__header-icon-links')}>
            <a
                className={pcn('__header-icon-link', '__header-icon-link--discord')}
                target='_blank'
                tabIndex='-1'
                rel='noreferrer'
                href={ links.DISCORD }
                dangerouslySetInnerHTML={{ __html: discordIcon }}>
            </a>
            <a
                className={pcn('__header-icon-link', '__header-icon-link--github')}
                target='_blank'
                tabIndex='-1'
                rel='noreferrer'
                href={ links.GITHUB_ORG }
                dangerouslySetInnerHTML={{ __html: githubIcon }}>
            </a>
            <a
                className={pcn('__header-icon-link', '__header-icon-link--twitter')}
                target='_blank'
                tabIndex='-1'
                rel='noreferrer'
                href={ links.TWITTER }
                dangerouslySetInnerHTML={{ __html: twitterIcon }}>
            </a>
        </div>
    ), [])

    return (
        <div className={className}>
            <span
                className={pcn('__blur')}
                dangerouslySetInnerHTML={{ __html: loginBlur }}>
            </span>
            <div className={pcn('__liner')}>
                <div className={pcn('__auth-panel')}>
                    { renderAuthPanelHeader() }
                    { renderAuthPanelBody() }
                </div>
                { renderAnimation() }
                { renderHeaderIconLinks() }
            </div>
        </div>
    )
}

export default Login