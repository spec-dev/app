import React, { useState, useCallback } from 'react'
import { getPCN } from '../../../utils/classes'
import { s3 } from '../../../utils/path'
import subIcon from '../../../svgs/sub'
import { noop } from '../../../utils/nodash'

const className = 'live-object-search-result'
const pcn = getPCN(className)

function LiveObjectSearchResult(props) {
    const { name, icon, desc, likes, author, onClick = noop } = props
    return (
        <div className={className} onClick={onClick}>
            <div className={pcn('__liner')}>
                <div className={pcn('__left')}>
                    <img
                        className={pcn('__icon')}
                        src={s3(icon)}
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
                    <div className={pcn('__author')}>
                        { author }
                    </div>
                    <div className={pcn('__likes')}>
                        <span>{ likes }</span>
                        <span dangerouslySetInnerHTML={{ __html: subIcon }}>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveObjectSearchResult