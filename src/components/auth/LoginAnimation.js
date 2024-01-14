import React, { useCallback, useEffect, useState, useRef } from 'react'
import { getPCN } from '../../utils/classes'
import { s3 } from '../../utils/nav'

const className = 'login-animation'
const pcn = getPCN(className)

const liveTableRows = [
    [
        {
            nsp: 'allov2',
            contract: 'Registry',
            name: 'ProfileCreated',
            recordCount: 4920
        },
        {
            nsp: 'elixir',
            contract: 'Allo',
            name: 'RoleGranted',
            recordCount: 1093
        },
        {
            nsp: 'station',
            contract: 'Allo',
            name: 'PoolCreated',
            recordCount: 822
        },
        {
            nsp: 'farcaster',
            contract: 'RFPSimple',
            name: 'MaxBidIncreased',
            recordCount: 323
        },
    ],
    [
        {
            nsp: 'uniswapv3',
            contract: 'Allo',
            name: 'StrategyApproved',
            recordCount: 1293
        },
        {
            nsp: 'allov2',
            contract: 'Registry',
            name: 'ProfileNameUpdated',
            recordCount: 200
        },
        {
            nsp: 'uniswapx',
            contract: 'Transactions',
            name: 'Transactions',
            recordCount: 10023
        },
        {
            nsp: 'across',
            contract: 'Allo',
            name: 'PoolFunded',
            recordCount: 106
        },
    ],
    [
        {
            nsp: 'allov2',
            contract: 'RFPSimple',
            name: 'MilestonesSet',
            recordCount: 392
        },
        {
            nsp: 'eth',
            contract: 'MerkleDistribution',
            name: 'Allocated',
            recordCount: 29
        },
        {
            nsp: 'polygon',
            contract: 'RFPCommitteeStrategy',
            name: 'Distributed',
            recordCount: 29
        },
        {
            nsp: 'allov2',
            contract: 'Allo',
            name: 'BaseFeePaid',
            recordCount: 823
        },
    ],
    [
        {
            nsp: 'endaoment',
            contract: 'Registry',
            name: 'ProfileCreated',
            recordCount: 4920
        },
        {
            nsp: 'uniswapv3',
            contract: 'Allo',
            name: 'RoleGranted',
            recordCount: 1093
        },
        {
            nsp: 'arbitrum',
            contract: 'Allo',
            name: 'PoolCreated',
            recordCount: 822
        },
        {
            nsp: 'allov2',
            contract: 'RFPSimple',
            name: 'MaxBidIncreased',
            recordCount: 323
        },
    ]
]

function LoginAnimation() {
    const [showLiveTables, setShowLiveTables] = useState(false)
    const liveTablesRef = useRef()

    useEffect(() => {
        if (!showLiveTables) {
            setTimeout(() => {
                setShowLiveTables(true)
            }, 50)
        }
    }, [showLiveTables])

    const renderLiveTable = useCallback((liveTable, i) => (
        <div key={i} className={pcn('__live-table')}>
            <div className={pcn('__live-table-liner')}>
                <div className={pcn('__live-table-icon')}>
                    <img src={`${s3(liveTable.nsp)}.jpg`}/>
                </div>
                <div className={pcn('__live-table-main')}>
                    <span>{liveTable.name}</span>
                    <span>{liveTable.nsp}.{liveTable.contract}</span>
                </div>
                <div className={pcn('__live-table-metadata')}>
                    <span className={pcn('__live-table-count')}>
                        { liveTable.recordCount.toLocaleString() }
                    </span>
                    <div className={pcn('__live-table-chains')}>
                        <span className={pcn('__live-table-chain', '__live-table-chain--1')}><span>E</span></span>
                        <span className={pcn('__live-table-chain', '__live-table-chain--137')}><span>P</span></span>
                        <span className={pcn('__live-table-chain', '__live-table-chain--8453')}><span>B</span></span>
                        <span className={pcn('__live-table-chain', '__live-table-chain--plus')}><span>+6</span></span>
                    </div>
                </div>
            </div>
        </div>
    ), [showLiveTables])

    const renderLiveTables = useCallback(() => {
        return (
            <div className={pcn('__live-tables', showLiveTables ? '__live-tables--show' : '')} ref={liveTablesRef}>
                <div className={pcn('__live-tables-liner')}>
                    { liveTableRows.map((row, i) => (
                        <div key={i} className={pcn('__live-tables-row')}>
                            { row.map((liveTable, j) => renderLiveTable(liveTable, j)) }
                        </div>
                    ))}
                </div>
                <div className={pcn('__live-tables-liner')}>
                    { liveTableRows.map((row, i) => (
                        <div key={i} className={pcn('__live-tables-row')}>
                            { row.map((liveTable, j) => renderLiveTable(liveTable, j)) }
                        </div>
                    ))}
                </div>
            </div>
        )
    }, [showLiveTables, renderLiveTable])

    return (
        <div className={className}>
            { renderLiveTables() }
        </div>
    )
}

export default LoginAnimation