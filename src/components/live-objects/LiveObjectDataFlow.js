import React, { useCallback, useState, useEffect } from 'react'
import { cn, getPCN } from '../../utils/classes'
import flowDiagram from '../../svgs/flow-diagram'
import caretIcon from '../../svgs/caret-down'
import { useHistory } from 'react-router-dom'
import transformIcon from '../../svgs/transform'
const className = 'live-object-data-flow'
const pcn = getPCN(className)

function LiveObjectDataFlow(props) {
    let history = useHistory()
    const { onShowTransform, onShowFunction } = props
    const [show, setShow] = useState(false)
    
    const renderTextContainer = useCallback(() => (
        <div className={pcn('__text-container')}>
            <div className={pcn('__name')}>
                Live Object
            </div>
            <div className={pcn('__title')}>
                Marketplace Listing
            </div>
            <div className={pcn('__subtitle')}>
                Represents a listing in a thirdweb marketplace contract.
            </div>
            <div className={pcn('__author')}>
                <span>by </span><span>@thirdweb</span>
            </div>
        </div>
    ), [])

    const renderBackButton = useCallback(() => (
        <div className={pcn('__back-button')} onClick={() => history.goBack()}>
            <span dangerouslySetInnerHTML={{ __html: caretIcon }}></span>
            <span>Back</span>
        </div>
    ), [])

    const renderFooter = useCallback(() => (
        <div className={pcn('__footer')}>
            <div className={pcn('__footer-liner')}>
                <div><span>Auto-Update</span></div>
                <div><span>Live Object</span></div>
                <div><span>Auto-Populate</span></div>
            </div>
        </div>
    ), [])

    useEffect(() => {
        if (!show) {
            setTimeout(() => setShow(true), 10)
        }
    }, [show])

    return (
        <div className={cn(className, show ? `${className}--show` : '')}>
            { renderTextContainer() }
            { renderBackButton() }
            <div className={pcn('__diagram')} dangerouslySetInnerHTML={{ __html: flowDiagram }}></div>
            <div class='blink-indicator blink-indicator--blue' id='bi1'><span></span></div>
            <div class='blink-indicator blink-indicator--blue' id='bi2'><span></span></div>
            <div class='blink-indicator blink-indicator--blue' id='bi3'><span></span></div>
            <div class='blink-indicator blink-indicator--blue' id='bi4'><span></span></div>
            <div id='shadowCircle'></div>
            <img id='rightCorner' src='/right-corner.svg' />
            <span id='tf1' className={pcn('__tf-icon')} dangerouslySetInnerHTML={{ __html: transformIcon }} onClick={onShowTransform}></span>
            <span id='tf2' className={pcn('__tf-icon')} dangerouslySetInnerHTML={{ __html: transformIcon }} onClick={onShowTransform}></span>
            <span id='tf3' className={pcn('__tf-icon')} dangerouslySetInnerHTML={{ __html: transformIcon }} onClick={onShowTransform}></span>
            <div id='functionOverlay' onClick={onShowFunction}></div>
            { renderFooter() }
        </div>
    )
}

export default LiveObjectDataFlow