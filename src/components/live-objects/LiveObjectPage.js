import React, { useCallback } from 'react'
import { cn, getPCN } from '../../utils/classes'
import flowIcon from '../../svgs/flow'
import { listingSpec } from '../../data/specs'
import { useHistory } from 'react-router-dom'

const className = 'live-object-page'
const pcn = getPCN(className)

function LiveObjectPage(props) {
    let history = useHistory()

    const viewDataFlow = useCallback(() => {
        history.push(window.location.pathname + '/flow')
    }, [])

    const renderProperties = useCallback(() => listingSpec.typeDef.properties.map((p, i) => (
        <div key={i} className={pcn('__doc-property')}>
            <div><span>{p.name}</span><span>{p.type}</span></div>
            <div>{p.desc}</div>
        </div>
    )), [])

    return (
        <div className={cn(className)}>
            <img src='/live-object-page-header.svg'/>
            <div className={pcn('__object-name')}>Marketplace Listing</div>
            <div className={pcn('__toolbar')}>
                <img src='/live-object-page-toolbar.svg'/>
                <div class={pcn('__view-data-flow-button')} onClick={viewDataFlow}>
                    <span dangerouslySetInnerHTML={{ __html: flowIcon }}></span>
                    <span>View Data Flow</span>
                </div>
            </div>
            <div className={pcn('__type-overview-liner')}>
                <div className={pcn('__docs')}>
                    <div className={pcn('__doc-properties')}>
                        { renderProperties() }
                    </div>
                </div>
                <div className={cn('editor', pcn('__interface'))}>
                    <div className={pcn('__interface-header')}>
                        <span>TS</span><span>Type Definition</span>
                    </div>
                    <div
                        className={pcn('__interface-body')}
                        dangerouslySetInnerHTML={{ __html: listingSpec.typeDef.code }}>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveObjectPage