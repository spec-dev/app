import React, { useState, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'

const className = 'tutorial-anno'
const pcn = getPCN(className)

function TutorialAnno(props) {
    const { icon, title, desc } = props
    const [show, setShow] = useState(props.show || false)

    useEffect(() => {
        if (!show && props.show) {
            setTimeout(() => setShow(true), 50)
        }
    }, [show, props.show])

    return (
        <div className={cn(className, show ? `${className}--show` : '', props.className)}>
            <div className={pcn('__liner')}>
                <div className={pcn('__top')}>
                    <span dangerouslySetInnerHTML={{ __html: icon }}></span>
                    <span>{title}</span>
                </div>
                <div className={pcn('__bottom')}>
                    <span>{desc}</span>
                </div>
            </div>
        </div>

    )
}

export default TutorialAnno