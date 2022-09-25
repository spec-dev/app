import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react'
import $ from 'jquery'
import { cn, getPCN } from '../../utils/classes'
import { noop } from '../../utils/nodash'
import { getRandom } from '../../utils/math'
import slideArrow from '../../svgs/slide-arrow'

const className = 'docs-section'
const pcn = getPCN(className)

const timing = {
    outputFloor: 0.8,
    outputCeiling: 4,
}

function DocsSection(props) {
    const { 
        title,
        desc,
        learnMoreLink,
        examples = [],
    } = props
    const [exampleIndex, setExampleIndex] = useState(0)
    const currentExample = useMemo(() => examples[exampleIndex] || {}, [exampleIndex, examples])
    const [output, setOutput] = useState([])
    const outputTimer = useRef()
    const startedOutputStream = useRef(false)
    const outputContainerRef = useRef()
    const scrollTargetRef = useRef()
    const autoScroll = useRef(true)

    const generateOutput = useCallback(() => {
        clearTimeout(outputTimer.current)
        if (currentExample.showOutput && currentExample.generateOutput) {
            setOutput(prevState => [ ...prevState, currentExample.generateOutput() ])

            if (autoScroll.current) {
                setTimeout(() => {
                    outputContainerRef.current && $(outputContainerRef.current).animate({ 
                        scrollTop: scrollTargetRef.current?.offsetTop - 585
                    }, 150)
                }, 30)    
            }

            outputTimer.current = setTimeout(() => {
                generateOutput()
            }, getRandom(timing.outputFloor, timing.outputCeiling) * 1000)
        }
    }, [currentExample])

    useEffect(() => {
        if (!startedOutputStream.current && currentExample.showOutput && currentExample.generateOutput) {
            startedOutputStream.current = true
            outputTimer.current = setTimeout(() => {
                generateOutput()
            }, getRandom(timing.outputFloor, timing.outputCeiling) * 1000)
        }
    }, [currentExample])

    const renderText = useCallback(() => (
        <div className={pcn('__text')}>
            <div className={pcn('__text-liner')}>
                <div className={pcn('__text-title')}>
                    { title }
                </div>
                <div className={pcn('__text-desc')}>
                    { desc }
                </div>
                <div className={pcn('__link-container')}>
                    { learnMoreLink && 
                        <a className={cn(pcn('__link'), '--with-slide-arrow')} href='#'>
                            <span>Learn more</span>
                            <span dangerouslySetInnerHTML={{ __html: slideArrow }}></span>
                        </a>
                    }
                </div>
            </div>
        </div>
    ), [title, desc, learnMoreLink])

    const renderSelectExamplesBar = useCallback(() => (
        <div className={pcn(
            '__examples-titles', 
            `__examples-titles--index-${exampleIndex}`,
            `__examples-titles--${currentExample.title?.toLowerCase()?.replaceAll(' ', '-')}`,
        )}>
            <div className={pcn('__selected-example-slider')}></div>
            { examples.map((example, i) => (
                <div
                    className={pcn(
                        '__examples-title', 
                        i === exampleIndex ? '__examples-title--selected' : '',
                    )}
                    key={i}
                    onClick={i === exampleIndex ? noop : () => {
                        setOutput([])
                        autoScroll.current = true
                        setExampleIndex(i)
                    }}>
                    <span>{example.title}</span>
                </div>
            ))}
        </div>
    ), [examples, exampleIndex, currentExample])

    const renderExamples = useCallback(() => (
        <div className={pcn('__examples')}>
            <div className={pcn('__examples-liner')}>
                { renderSelectExamplesBar() }
                <div
                    className={pcn('__examples-code')}
                    dangerouslySetInnerHTML={{ __html: currentExample.code }}>
                </div>
                { currentExample.showOutput && 
                    <div
                        className={pcn('__examples-output')}
                        ref={outputContainerRef}
                        onWheel={() => { autoScroll.current = false }}>
                        { output.map((html, i) => (
                            <div
                                key={i}
                                className={pcn('__examples-output-group')}
                                dangerouslySetInnerHTML={{ __html: html }}>    
                            </div>
                        ))}
                        { <div id='scrollTarget' ref={scrollTargetRef}></div> }
                    </div>
                }
            </div>
        </div>
    ), [currentExample, output, renderSelectExamplesBar])

    return (
        <div className={cn(className, `${className}--${title.replaceAll(' ', '-').toLowerCase()}`)}>
            <div className={pcn('__liner')}>
                { renderText() }
                { renderExamples() }
            </div>
        </div>
    )
}

export default DocsSection