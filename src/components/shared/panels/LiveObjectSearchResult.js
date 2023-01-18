import React, { useMemo } from 'react'
import { getPCN } from '../../../utils/classes'
import { s3 } from '../../../utils/path'
import { noop } from '../../../utils/nodash'
import { sortInts } from '../../../utils/math'
import { chainNames } from '../../../utils/chains'

const className = 'live-object-search-result'
const pcn = getPCN(className)

function LiveObjectSearchResult(props) {
    const { 
        id,
        name, 
        desc, 
        latestVersion = {},
        onClick = noop,
    } = props
    const supportedChainIds = useMemo(() => sortInts(
        Object.keys(latestVersion?.config?.chains || {}).map(v => parseInt(v))
    ).map(v => v.toString()), [latestVersion])
    const supportedChainNames = useMemo(() => (
        supportedChainIds.map(chainId => chainNames[chainId]).filter(v => !!v)
    ), [supportedChainIds])

    return (
        <div className={className} onClick={onClick}>
            <div className={pcn('__liner')}>
                <div className={pcn('__left')}>
                    <img
                        className={pcn('__icon')}
                        src={s3(`${id}.jpg`)}
                        alt=""
                    />
                    <div className={pcn('__main')}>
                        <div className={pcn('__name')}>
                            { name }
                        </div>
                        <div className={pcn('__desc')}>
                            <span>{ desc }</span>
                        </div>
                    </div>
                </div>
                <div className={pcn('__right')}>
                    <div className={pcn('__chains')}>
                        { supportedChainNames.map((chain, i) => (
                            <div key={i} className={pcn(
                                '__chain', 
                                `__chain--${chain.toLowerCase()}`
                            )}>
                                <span>{chain[0]}</span>
                            </div>
                        ))}
                    </div>
                    <div className={pcn('__nsp')}>
                        <span>@{ latestVersion.nsp }</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveObjectSearchResult