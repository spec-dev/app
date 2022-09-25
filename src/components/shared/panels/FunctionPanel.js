import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react'
import { getPCN } from '../../../utils/classes'
import LiveObjectSearch from './LiveObjectSearch'
import NewLiveColumnSpecs from './NewLiveColumnSpecs'
import { animated, useTransition } from 'react-spring'
import { noop } from '../../../utils/nodash'
import invokeIcon from '../../../svgs/invoke'
import tfCode from '../../../svgs/transform-code'
import checkIcon from '../../../svgs/check'
import githubIcon from '../../../svgs/github'
import examples from '../../../data/examples'
import { specs } from '../../../data/specs'
import spinner from '../../../svgs/chasing-tail-spinner'

const className = 'function-panel'
const pcn = getPCN(className)

function FunctionPanel(props, ref) {
    const { onCancel = noop } = props

    const onClickCancel = useCallback(() => {
        onCancel()
    }, [onCancel])

    const renderHeader = useCallback(() => (
        <div className={pcn('__header')}>
            <div className={pcn('__header-liner')}>
                <div className={pcn('__header-title')}>
                    <span dangerouslySetInnerHTML={{ __html: invokeIcon }}></span>
                    <span>Edge Function</span>
                </div>
            </div>
            <div className={pcn('__header-status')}>
                <span
                    className={pcn('__header-status-icon')}
                    dangerouslySetInnerHTML={{ __html: checkIcon }}>
                </span>
                <span>Live</span>
            </div>
        </div>
    ), [])

    const renderSubheader = useCallback(() => (
        <div className={pcn('__subheader')}>
            <div className={pcn('__tf')}>
                <span>// Get a listing from a marketplace contract.</span>
            </div>
            <span dangerouslySetInnerHTML={{ __html: githubIcon }}></span>
        </div>
    ))

    const renderBody = useCallback(() => (
        <div className={pcn('__body')}>
            <div className={pcn('__code')} dangerouslySetInnerHTML={{ __html: examples.functionExample }}></div>
            <span id="indent1"></span>
            <span id="indent2"></span>
        </div>
    ))

    const renderFooter = useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div
                    className={pcn('__footer-button', '__footer-button--shown')}
                    onClick={onClickCancel}>
                    <span>{ 'Cancel'}</span>
                </div>
            </div>
        </div>
    ), [onClickCancel])

    return (
        <div className={className}>
            { renderHeader() }
            { renderSubheader() }
            { renderBody() }
            { renderFooter() }
        </div>
    )
}

FunctionPanel = forwardRef(FunctionPanel)
export default FunctionPanel