import React, { useCallback, useMemo, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import $ from 'jquery'
import { cn, getPCN } from '../../utils/classes'
import Slider from '../shared/sliders/Slider'
import NewLiveColumnPanel, { referrers } from '../shared/panels/NewLiveColumnPanel'
import CountUp from 'react-countup'
import NewColumnDropdown from '../shared/dropdowns/NewColumnDropdown'
import pm from '../../managers/project/projectManager'
import { selectTableRecords, selectTableCount } from '../../sql'
import { sum } from '../../utils/math'
import { displayColType, isJSONColumn } from '../../utils/colTypes'
import { getNewCount, tableCounts } from '../../utils/counts'
import { stringify } from '../../utils/json'
import EditColumnPanel from '../shared/panels/EditColumnPanel'
import { getLiveColumnsForTable, getLiveColumnLinksOnTable } from '../../utils/config'
import {
    filterIcon,
    blistIcon,
    historyIcon,
    modelRelationshipIcon,
    keyIcon,
    checkIcon,
    specIcon,
    linkIcon,
} from '../../svgs/icons'
import Flipper from '../shared/Flipper'
import { pendingSeeds } from '../../utils/pendingSeeds'
import constants from '../../constants'
import { noop } from '../../utils/nodash'
import { hasTableBeenSeeded, markTableAsSeeded } from '../../utils/cache'
import logger from '../../utils/logger'

const className = 'tables-body'
const pcn = getPCN(className)

const lensProfiles = [
    {
        "id": 1,
        "handle": "currineil7.lens",
        "owner_address": "0x53C19C061572C0a7c8a55026aa4324E44ABaB3c6".toLowerCase(),
        "profile_id": 7461,
        "chain_id": 137,
        "image_uri": "ipfs://QmbNH5JWGZeYy7kXEfdrgr4by88r1z2PqPFxXLeAM2KuYc"
    },
    {
        "id": 2,
        "handle": "0xmanny.lens",
        "owner_address": "0xAd097B4D01D88f48eaD9446eEccA314fF50DCf7E".toLowerCase(),
        "profile_id": 26150,
        "chain_id": 137,
        "image_uri": null
    },
    {
        "id": 3,
        "handle": "opaoas.lens",
        "owner_address": "0x48937c1Be5899B4d9f8eb760f1FE4c46983CeF00".toLowerCase(),
        "profile_id": 28682,
        "chain_id": 137,
        "image_uri": null
    },
    {
        "id": 4,
        "handle": "monkex.lens",
        "owner_address": "0xBad52370b73D006199f99cC1612AeA0E63812640".toLowerCase(),
        "profile_id": 108069,
        "chain_id": 137,
        "image_uri": "ipfs://QmPZkyKWGqPaxWnsCMqoPfSc2ehGGE72zrHmM3g9wv3GwR"
    },
    {
        "id": 5,
        "handle": "griswold.lens",
        "owner_address": "0x7667F3f416C9a81f9a0BD91dec4A1B91480B6FEc".toLowerCase(),
        "profile_id": 20256,
        "chain_id": 137,
        "image_uri": "ipfs://bafybeiadypal4pxumshdwgw4wvw3ufmlolbatitmwnq6rggkcy7njhn5ai"
    },
    {
        "id": 6,
        "handle": "vcastellm.lens",
        "owner_address": "0x3ce9FB845F4899FF8D02EeBd5574264aaB8f44c2".toLowerCase(),
        "profile_id": 44429,
        "chain_id": 137,
        "image_uri": "https://statics-polygon-lens.s3.eu-west-1.amazonaws.com/profile/nft-0x3ce9FB845F4899FF8D02EeBd5574264aaB8f44c2_polygon_0xa9a6A3626993D487d2Dbda3173cf58cA1a9D9e9f_9283720973644948943262049247792555530139156149864327730573565587202248534226.svg"
    },
    {
        "id": 7,
        "handle": "jdkatani.lens",
        "owner_address": "0x0356B42ca8927146b89092D41F1e3abA0d3fedb5".toLowerCase(),
        "profile_id": 101245,
        "chain_id": 137,
        "image_uri": "ipfs://bafkreihbauwbckzzupyzwugd4lawfghb54nipvgnqssrgq5khwc76xnp7a"
    },
    {
        "id": 8,
        "handle": "aaaeeeggg.lens",
        "owner_address": "0x469Adaf766fb35F1a3c2569FE8C57a50F4B39131".toLowerCase(),
        "profile_id": 75383,
        "chain_id": 137,
        "image_uri": null
    },
    {
        "id": 9,
        "handle": "996fubao.lens",
        "owner_address": "0x08377E7dC1821739A09de1B3A3d4e2078B4D7D5F".toLowerCase(),
        "profile_id": 94517,
        "chain_id": 137,
        "image_uri": "ipfs://bafybeifcebpyedcx62yz3khn2utts7zrjhu4bwjf35md3iy6gyaffczwvy"
    },
    {
        "id": 10,
        "handle": "vovacodes.lens",
        "owner_address": "0x20E93571cf5d64A6eE4353DC04eb60Ded6498a69".toLowerCase(),
        "profile_id": 34232,
        "chain_id": 137,
        "image_uri": null
    },
    {
        "id": 11,
        "handle": "bigwallet.lens",
        "owner_address": "0x1eD89728d8774B021C62d8DCc397e8ab2a4D00aF".toLowerCase(),
        "profile_id": 38427,
        "image_uri": null,
        "chain_id": 137,
    },
    {
        "id": 12,
        "handle": "mater.lens",
        "owner_address": "0xAA8aFC665a4fDb42294396809c55fE01D920b093".toLowerCase(),
        "profile_id": 108487,
        "chain_id": 137,
        "image_uri": "ipfs://bafybeigtzjdj4doarxobe6qoncjmkc7xvafonk6ecs3e4hseos2nt4aj7u"
    },
    {
        "id": 13,
        "handle": "blockchainbrett.lens",
        "owner_address": "0x1e341Aa44c293d95d13d778492D417D1BE4E63D5".toLowerCase(),
        "profile_id": 1336,
        "chain_id": 137,
        "image_uri": "https://ipfs.infura.io/ipfs/QmWrDZaxQBJPCgz4SsS19P4T86fLivfLCtxyBjqwGUbvVe"
    },
    {
        "id": 14,
        "handle": "lion8848.lens",
        "owner_address": "0xDC3099A8A261A5FA7fED97B19520Df5e5bf5322F".toLowerCase(),
        "profile_id": 360,
        "chain_id": 137,
        "image_uri": "https://ipfs.infura.io/ipfs/QmfHgy7cKapKRkGvfnWCwzRbk3rN177KwXWBMkmS5tdsLe"
    },
    {
        "id": 15,
        "handle": "ryanda.lens",
        "owner_address": "0x70d9e9b83792DF619fCAdd6D53d42D39a87bA1FC".toLowerCase(),
        "profile_id": 54917,
        "chain_id": 137,
        "image_uri": "ipfs://bafkreideqopkffpvyyt7vbi5ahw2cuubefwu26rpqomaoqaysy2457nrym"
    },
    {
        "id": 16,
        "handle": "posit.lens",
        "owner_address": "0x339af867854Ac9fF6ceC147eb2f3c19aCbe8a1f8".toLowerCase(),
        "profile_id": 44432,
        "chain_id": 137,
        "image_uri": "ipfs://bafkreih3wqcurn7cgmdk5mka3iq7jzzrfpve3avq2eirh5mdghqkyylosq"
    },
    {
        "id": 17,
        "handle": "lookup.lens",
        "owner_address": "0xd9b3a30b1EB093d7BAD772ad89c70b751F235Fed".toLowerCase(),
        "profile_id": 54775,
        "chain_id": 137,
        "image_uri": "ipfs://bafybeifnrbjfb652q6jeourbdolgg57n6csovzpn34pgtntvpqjgopdqwe"
    },
    {
        "id": 18,
        "handle": "mreza.lens",
        "owner_address": "0x1CbD1cd53dD1a91b15adE97F5D78bb54dB598538".toLowerCase(),
        "profile_id": 15271,
        "chain_id": 137,
        "image_uri": "https://statics-polygon-lens.s3.eu-west-1.amazonaws.com/profile/nft-0x1CbD1cd53dD1a91b15adE97F5D78bb54dB598538_eth_0x932261f9Fc8DA46C4a22e31B45c4De60623848bF_6591.png"
    },
    {
        "id": 19,
        "handle": "ibnufals0.lens",
        "owner_address": "0x2011627c94F2dB0918b666E5c55D9c6b7765BA04".toLowerCase(),
        "profile_id": 3848,
        "chain_id": 137,
        "image_uri": "https://ipfs.infura.io/ipfs/QmQR6mGZe8KFFrbueSkNuN5ZQ2WVJbckgy6bV5rnwEkAqL"
    },
    {
        "id": 20,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 21,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 22,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 23,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 24,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 25,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 26,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 27,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 28,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 29,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 30,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 31,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 32,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 33,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 34,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 35,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 36,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 37,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 38,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 39,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 40,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 41,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 42,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 43,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 44,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 45,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 46,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 47,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 48,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 49,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 50,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 51,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 52,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 53,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 54,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 55,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 56,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 57,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 58,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 59,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 60,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 61,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 62,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 63,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 64,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 65,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 66,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 67,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 68,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 69,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 70,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 71,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 72,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 73,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 74,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    },
    {
        "id": 75,
        "handle": null,
        "owner_address": null,
        "profile_id": null,
        "image_uri": null
    }
]

export const tableStatus = {
    BACKFILLING: {
        id: 'backfilling',
        title: 'Backfilling...',
    },
    POPULATING: {
        id: 'populating',
        title: 'Backfilling...',
    },
    IN_SYNC: {
        id: 'in-sync',
        title: 'In Sync',
    }
}

const colWidthConfig = {
    DEFAULT_OFFSET: 25,
    PIXELS_PER_CHAR: 7,
    IDEAL_NAME_TYPE_GUTTER: 50,
    CHECK_COLUMN_WIDTH: 47,
    NEW_COLUMN_WIDTH: 105,
    MIN_WIDTH: 120,
}

const ROW_HEIGHT = 36

const getColHeaderIcon = (
    isLinkColumn,
    isPrimaryKey,
    isForeignKey,
) => {
    if (isLinkColumn) {
        return [linkIcon, 'link']
    }
    if (isPrimaryKey) {
        return [keyIcon, 'key']
    }
    if (isForeignKey) {
        return [modelRelationshipIcon, 'rel']
    }
    return [null, null]
}

const compileLiveColumnDataForTable = (table, config) => {
    if (!table?.name) return {}

    // Get the live columns and link columns related to this table.
    const liveColumns = getLiveColumnsForTable(table.schema, table.name, config)
    const linkColumns = getLiveColumnLinksOnTable(table.schema, table.name, config)

    for (const linkColumn of linkColumns) {
        liveColumns[linkColumn.column] = {
            ...(liveColumns[linkColumn.column] || linkColumn.liveObject),
            targetTablePath: linkColumn.targetTablePath,
            isLinkColumn: true,
            isSeedColumn: !!linkColumn.isSeedColumn,
        }
    }

    return liveColumns
}

const didColumnsChange = (newCols, oldCols) => {
    if (newCols.length !== oldCols.length) return true
    
    for (let i = 0; i < newCols.length; i++) {
        const newCol = newCols[i]
        const oldCol = oldCols[i]
        
        if (newCol.name !== oldCol.name || newCol.data_type !== oldCol.data_type) {
            return true
        }
    }
    
    return false
}

const getColumnWidths = (table, liveColumns) => {
    if (!table?.columns) return []
    
    const widths = []
    for (const col of table.columns) {
        let numChars = col.name.length
        const liveColumnData = liveColumns[col.name]
        const numColTypeChars = (liveColumnData?.givenName || displayColType(col.data_type)).length
        numChars += numColTypeChars
        let colWidth = (
            colWidthConfig.DEFAULT_OFFSET +
            (numChars * colWidthConfig.PIXELS_PER_CHAR) + 
            colWidthConfig.IDEAL_NAME_TYPE_GUTTER
        )

        if (col.name === 'image_uri') {
            colWidth = 300
        }
        if (col.name === 'handle') {
            colWidth = 200
        }
        if (col.name === 'owner_address') {
            colWidth = 260
        }

        widths.push(Math.max(colWidth, colWidthConfig.MIN_WIDTH))
    }

    return widths
}

const defaultInitialStatus = (initialSeedCursor, schema, tableName) => {
    const tablePath = [schema, tableName].join('.')
    if (pendingSeeds.has(tablePath)) {
        pendingSeeds.delete(tablePath)
        return tableStatus.BACKFILLING.id
    }

    if (!initialSeedCursor) return tableStatus.IN_SYNC.id
    return tableStatus.BACKFILLING.id
}

const defaultSortRules = (primaryKeyColNames) => (
    Array.from(primaryKeyColNames).map(column => ({ column, order: 'asc' }))
) 

const timing = {
    rowFadeInDelay: 32,
}

function TablesBody(props, ref) {
    // Props.
    const { schema, config = {}, tablesLoaded, refetchTables = noop } = props

    // State.
    const [table, setTable] = useState(props.table || {})
    const [status, setStatus] = useState(props.status || defaultInitialStatus(props.seedCursor, schema, table?.name))
    const [records, setRecords] = useState(props.records || null)
    const [count, setCount] = useState(table?.name ? (tableCounts[[schema, table.name].join('.')] || null) : null)
    const [liveDataPanelReferrer, setLiveDataPanelReferrer] = useState(referrers.ADD_LIVE_DATA)

    // Constraints.
    const primaryKeyColNames = useMemo(() => new Set((table?.primary_keys || []).map(pk => pk.name)), [table])
    const foreignKeyColNames = useMemo(() => new Set((table?.relationships || []).filter(
        rel => rel.source_table_name === table.name
    ).map(rel => rel.source_column_name)), [table])
    
    const sortRules = useMemo(() => defaultSortRules(primaryKeyColNames), [primaryKeyColNames])

    // Live column info.
    const liveColumns = useMemo(() => compileLiveColumnDataForTable(table, config), [table, config])
    const hasLiveColumns = useMemo(() => Object.keys((
        (config?.tables || {})[schema] || {})[table.name] || {}
    ).length > 0, [config, schema, table])

    // Sizing.
    const columnWidths = useMemo(() => getColumnWidths(table, liveColumns), [table, liveColumns])
    const gridTemplateColumnsValue = useMemo(() => [
        colWidthConfig.CHECK_COLUMN_WIDTH,
        ...columnWidths,
        colWidthConfig.NEW_COLUMN_WIDTH,
    ].map(w => `${w}px`).join(' '), [columnWidths])
    const mainWidth = useMemo(() => sum([
        // colWidthConfig.CHECK_COLUMN_WIDTH,
        ...columnWidths.slice(1),
        colWidthConfig.NEW_COLUMN_WIDTH,
    ], [columnWidths]))

    const pkGridTemplateColumnsValue = useMemo(() => [
        colWidthConfig.CHECK_COLUMN_WIDTH,
        columnWidths[0],
    ].map(w => `${w}px`).join(' '), [columnWidths])

    // Refs.
    const newLiveColumnSliderRef = useRef()
    const newLiveColumnPanelRef = useRef()
    const editColumnSliderRef = useRef()
    const editColumnPanelRef = useRef()
    const newColumnDropdownRef = useRef()
    const shouldShowLiveDataPanel = useRef(false)
    const extendTableDropdownRef = useRef()
    const configureEditColumnPanelArgs = useRef([])
    const transformObjectSliderRef = useRef()
    const hookSliderRef = useRef()
    const seedCursor = useRef(props.seedCursor || null)
    const backfillingCallback = useRef(null)
    const backfillingTimer = useRef(null)
    const fadeInRowIndexesRange = useRef([])
    const tablesBodyRef = useRef()
    const prevCount = useRef(table?.name ? (tableCounts[[schema, table.name].join('.')] || null) : null)
    const fadeInTimer = useRef(null)
    const removeAccentTimer = useRef(null)
    const removePopulatingTimer = useRef(null)
    const nextPageFetchOffset = useRef(null)
    const mainRef = useRef()
    const recordsRef = useRef()
    const prevScrollY = useRef(0)
    const resetScroll = useRef(false)
    const isFirstSeed = useRef(false)

    const addTransform = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        transformObjectSliderRef.current?.show()
    }, [])

    const addHook = useCallback(liveObjectSpec => {
        window.liveObjectSpec = liveObjectSpec
        hookSliderRef.current?.show()
    }, [])

    const onSaveLiveColumns = useCallback(() => {
        newLiveColumnSliderRef.current?.hide()
    }, [])

    const showLiveDataPanel = useCallback((referrer) => {
        if (liveDataPanelReferrer === referrer) {
            newLiveColumnSliderRef.current?.show()
        } else {
            shouldShowLiveDataPanel.current = true
            setLiveDataPanelReferrer(referrer)
        }
    }, [liveDataPanelReferrer])

    const onNewLiveColumnSliderShown = useCallback(() => {
        setTimeout(() => {
            newLiveColumnPanelRef.current?.focusSearchBar()
        }, 400)
    }, [])

    const onClickExtendTable = useCallback(() => {
        extendTableDropdownRef.current?.show()
    }, [])

    const onSelectNewColumnType = useCallback(({ id }) => {
        if (id === 'live') {
            showLiveDataPanel(referrers.NEW_LIVE_COLUMN)
        }
    }, [showLiveDataPanel])
    
    const showEditColumnSlider = useCallback((column, cb) => {
        if (editColumnPanelRef.current) {
            editColumnPanelRef.current.configure(column, cb)
        } else {
            configureEditColumnPanelArgs.current = [column, cb]
        }
        editColumnSliderRef.current?.show()
    }, [])

    const loadPageRecords = useCallback(async (trackChanges) => {
        let sortBy = sortRules
        if (!sortBy.length && primaryKeyColNames.size) {
            sortBy = defaultSortRules(primaryKeyColNames)
        }
        
        const offset = 0
        const limit = Math.max(records?.length || 0, constants.RECORDS_PER_PAGE)

        let { rows: data, error } = await pm.query(selectTableRecords(
            table.name, 
            sortBy, 
            offset,
            limit,
        ))

        if (error) {
            logger.error(error)
            fadeInRowIndexesRange.current = []
            setRecords([])
            return
        }
        
        if (trackChanges && !fadeInRowIndexesRange.current?.length) {
            const prevNumRowsOnPage = records?.length || 0

            if (table.name === 'lens_profiles') {
                data = lensProfiles
            }
            
            const numRowsOnPage = data.length

            if (numRowsOnPage <= prevNumRowsOnPage) {
                fadeInRowIndexesRange.current = []
            } else {
                const rowsPerTableHeight = Math.ceil($(`.${pcn('__main')}`).height() / ROW_HEIGHT)
                const rowDelta = numRowsOnPage - prevNumRowsOnPage
                fadeInRowIndexesRange.current = [prevNumRowsOnPage, prevNumRowsOnPage + Math.max(rowDelta, rowsPerTableHeight)]
            }
        }

        setRecords(data)
    }, [schema, table.name, sortRules, primaryKeyColNames, records?.length])

    const fetchNextPage = useCallback(async () => {
        if (!records?.length) return
        if (nextPageFetchOffset.current && records.length <= nextPageFetchOffset.current) {
            return
        }
        nextPageFetchOffset.current = records.length

        let sortBy = sortRules
        if (!sortBy.length && primaryKeyColNames.size) {
            sortBy = defaultSortRules(primaryKeyColNames)
        }

        const { rows: data, error } = await pm.query(selectTableRecords(
            table.name,
            sortBy, 
            records.length,
            constants.RECORDS_PER_PAGE,
        ))

        if (error) {
            logger.error(error)
            return
        }

        setRecords([ ...records, ...data ])
    }, [schema, table.name, sortRules, records, primaryKeyColNames])

    const loadRecordCount = useCallback(async () => {
        const tablePath = [schema, table.name].join('.')
        const { rows: data, error } = await pm.query(selectTableCount(tablePath))
        if (error) {
            logger.error(error)
            return
        }

        const countResult = (data[0] || {}).count || 0
        if (hasLiveColumns) {
            tableCounts[tablePath] = countResult
        }

        prevCount.current = countResult
        setCount(countResult)
    }, [schema, table])

    const onDataChange = useCallback(async (events) => {
        const tablePath = [schema, table.name].join('.')
        if (!tableCounts.hasOwnProperty(tablePath)) {
            tableCounts[tablePath] = getNewCount(count, events)
        }

        if (records !== null && records.length < constants.RECORDS_PER_PAGE) {
            await loadPageRecords(true)
        }

        if (status === tableStatus.BACKFILLING.id) {
            const cb = () => {
                setStatus(tableStatus.POPULATING.id)
                setCount(tableCounts[tablePath])
            }
            if (backfillingTimer.current) {
                backfillingCallback.current = cb
            } else {
                setTimeout(() => {
                    cb()
                }, 100)
            }
        } else {
            setCount(tableCounts[tablePath])
        }
    }, [loadPageRecords, status, schema, table, count, records])

    const onScroll = useCallback(() => {
        if (!recordsRef.current || !mainRef.current) return

        const recordsHeight = recordsRef.current.offsetHeight
        const scrollY = mainRef.current.scrollTop
        const prevScrollYValue = prevScrollY.current
        prevScrollY.current = scrollY

        if (scrollY <= prevScrollYValue || (scrollY / recordsHeight < 0.72)) {
            return
        }

        fetchNextPage()
    }, [fetchNextPage])

    useImperativeHandle(ref, () => ({
        onDataChange: events => onDataChange(events),
        onNewLiveTable: () => showLiveDataPanel(referrers.NEW_LIVE_TABLE)
    }), [onDataChange, showLiveDataPanel])

    useEffect(() => {
        if (props.table?.name !== table.name) {
            if (backfillingTimer.current) {
                clearTimeout(backfillingTimer.current)
                backfillingTimer.current = null
                backfillingCallback.current = null
            }
            if (fadeInTimer.current) {
                clearTimeout(fadeInTimer.current)
                fadeInTimer.current = null
            }
            if (removeAccentTimer.current) {
                clearTimeout(removeAccentTimer.current)
                removeAccentTimer.current = null
            }
            if (removePopulatingTimer.current) {
                clearTimeout(removePopulatingTimer.current)
                removePopulatingTimer.current = null
            }
            fadeInRowIndexesRange.current = []
            nextPageFetchOffset.current = null
            setTable(props.table || {})

            const initialStatus = props.table 
                ? defaultInitialStatus(props.seedCursor, schema, props.table.name)
                : tableStatus.IN_SYNC.id

            if (props.table && initialStatus === tableStatus.BACKFILLING.id) {
                isFirstSeed.current = !hasTableBeenSeeded(props.table.id)
            }
            setStatus(initialStatus)
            const nextCount = props.table?.name ? (tableCounts[[schema, props.table.name].join('.')] || null) : null
            prevCount.current = nextCount
            setCount(nextCount)
            resetScroll.current = true
            setRecords(null)
            return
        } 
        
        if (props.table && didColumnsChange(props.table.columns, table.columns)) {
            if (backfillingTimer.current) {
                clearTimeout(backfillingTimer.current)
                backfillingTimer.current = null
                backfillingCallback.current = null
            }
            if (fadeInTimer.current) {
                clearTimeout(fadeInTimer.current)
                fadeInTimer.current = null
            }
            if (removeAccentTimer.current) {
                clearTimeout(removeAccentTimer.current)
                removeAccentTimer.current = null
            }
            if (removePopulatingTimer.current) {
                clearTimeout(removePopulatingTimer.current)
                removePopulatingTimer.current = null
            }
            fadeInRowIndexesRange.current = []
            nextPageFetchOffset.current = null
            const newColsExist = props.table.columns.length > table.columns.length
            setTable(props.table)
            setStatus(defaultInitialStatus(props.seedCursor, schema, props.table.name))
        }
    }, [schema, table, props.table, props.seedCursor, primaryKeyColNames, mainWidth])

    useEffect(() => {
        if (table?.name && records === null) {
            if (count === null) {
                loadRecordCount()
            } else {
                prevCount.current = count
            }
            loadPageRecords()
        }
    }, [table, records, count, loadPageRecords, loadRecordCount])

    useEffect(() => {
        if (resetScroll.current) {
            resetScroll.current = false
            prevScrollY.current = 0
            if (mainRef.current) {
                $(mainRef.current).scrollLeft(0)
                $(mainRef.current).scrollTop(0)
            }
        }
    }, [records?.length])

    useEffect(() => {
        if (props.seedCursor) {
            // New seed.
            if (seedCursor.current === null || seedCursor.current.id !== props.seedCursor.id) {
                seedCursor.current = props.seedCursor
                setStatus(tableStatus.BACKFILLING.id)
                
                backfillingCallback.current = null
                backfillingTimer.current = setTimeout(() => {
                    backfillingTimer.current = null
                    backfillingCallback.current && backfillingCallback.current()
                    backfillingCallback.current = null
                }, 2000)
            }
            // Seed updated.
            else if (seedCursor.current.id === props.seedCursor.id) {
                seedCursor.current = props.seedCursor
            }
        }
        // Seed complete.
        else if (seedCursor.current) {
            seedCursor.current = null
            if (backfillingTimer.current === null && removePopulatingTimer.current === null) {
                setTimeout(() => {
                    setStatus(tableStatus.IN_SYNC.id)
                }, 1000)
            }
        }
    }, [props.seedCursor])

    useEffect(() => {
        if (shouldShowLiveDataPanel.current) {
            shouldShowLiveDataPanel.current = false
            newLiveColumnSliderRef.current?.show()
        }
    })

    useEffect(() => {
        if (status === tableStatus.POPULATING.id) {
            const fadeInIndexes = fadeInRowIndexesRange.current || []
            const from = fadeInIndexes[0] || 0
            const to = fadeInIndexes[1] || 0
            const numNewRecords = to - from
            removePopulatingTimer.current = setTimeout(() => {
                removePopulatingTimer.current = null
                if (!seedCursor.current) {
                    setStatus(tableStatus.IN_SYNC.id)
                }
            }, numNewRecords ? (numNewRecords * timing.rowFadeInDelay) : 0)
        } 
    }, [status])

    useEffect(() => {
        if (status === tableStatus.IN_SYNC.id) {
            if (fadeInRowIndexesRange.current?.length) {
                if (isFirstSeed.current) {
                    isFirstSeed.current = false
                    markTableAsSeeded(props.table.id)
                    fadeInRowIndexesRange.current = []
                } else {
                    fadeInTimer.current = setTimeout(() => {
                        $(`.${pcn('__row')}--new`).css('opacity', 1)
                        fadeInRowIndexesRange.current = []
                        removeAccentTimer.current = setTimeout(() => {
                            $(`.${pcn('__row')}--new`).removeClass(`${pcn('__row')}--new-accent`)
                        }, 500)
                    }, 10)
                }
            }
        }
    })

    const renderStatus = useCallback(() => (
        <div className={pcn('__header-status-container')}>
            <div className={pcn('__header-status', `__header-status--backfilling`)}>
                <span>{ isFirstSeed.current ? tableStatus.BACKFILLING.title : 'Syncing...' }</span>
            </div>
            <div className={pcn('__header-status', `__header-status--in-sync`)}>
                <span
                    className={pcn('__header-status-icon', '__header-status-icon--check')}
                    dangerouslySetInnerHTML={{ __html: checkIcon }}>
                </span>
                <span>{ tableStatus.IN_SYNC.title }</span>
            </div>
        </div>
    ), [])

    const renderNumRecords = useCallback((mod) => {
        let start = prevCount.current || 0
        let end = count || 0

        if (start !== end) {
            prevCount.current = end
        } 

        let duration = 0
        if (end > start) {
            duration = (end - start) / 1000
            const fadeInIndexes = fadeInRowIndexesRange.current || []
            const from = fadeInIndexes[0] || 0
            const to = fadeInIndexes[1] || 0
            const numNewRecords = to - from
            if (numNewRecords) {
                duration = (numNewRecords * timing.rowFadeInDelay) / 1000
            }
        }

        if (table?.name === 'wallets') {
            start = 92
            end = 92
        }
        else if (table?.name === 'lens_profiles' && end == 15) {
            end = 41
        } else if (table?.name === 'report_received_events' && end > 0) {
            end = 3301
        }

        return (
            <div className={pcn(`__${mod}-num-records`)}>
                <CountUp start={start} end={end} delay={0} duration={duration} separator=','>
                    {({ countUpRef }) => (
                        <span>
                            <span style={count === null ? { display: 'none' } : {}} ref={countUpRef}></span>
                            <span>{ `${count === null ? '-- ' : ''}Record${count !== 1 ? 's' : ''}` }</span>
                        </span>
                    )}
                </CountUp>
            </div>
        )
    }, [count, table])

    const renderFilterButton = useCallback(() => (
        <div className={pcn('__filter-button')}>
            <span dangerouslySetInnerHTML={{ __html: filterIcon }}></span>
            <span>Filter</span>
        </div>
    ), [])

    const renderSortButton = useCallback(() => (
        <div className={pcn('__sort-button')}>
            <span dangerouslySetInnerHTML={{ __html: blistIcon }}></span>
            <span>Sort</span>
        </div>
    ), [])

    const renderLinkObjectButton = useCallback(() => (
        <div className={pcn('__header-new-col-button')}>
            <span id='newColDropdownTarget' onClick={() => showLiveDataPanel(referrers.ADD_LIVE_DATA)}>
                <span>+</span>
                <span>Add Live Data</span>
            </span>
        </div>
    ), [showLiveDataPanel])

    const renderHistoryButton = useCallback(() => (
        <div className={pcn('__history-button')}>
            <span dangerouslySetInnerHTML={{ __html: historyIcon }}></span>
            <span>History</span>
        </div>
    ), [])

    const renderColHeaders = useCallback((givenStatus) => {
        const colHeaders = [(
            <div key='check' className={pcn('__col-header', '__col-header--check-col')}>
                <span></span>
            </div>
        )]

        table.columns.forEach(col => {
            const liveColumnData = liveColumns[col.name]
            const isLiveOrLinkColumn = !!liveColumnData
            const isLinkColumn = liveColumnData?.isLinkColumn
            const isPrimaryKey = primaryKeyColNames.has(col.name)
            const isForeignKey = foreignKeyColNames.has(col.name)
            const [icon, mod] = getColHeaderIcon(isLinkColumn, isPrimaryKey, isForeignKey)
            const colType = liveColumnData?.givenName || displayColType(col.data_type)
            
            colHeaders.push((
                <div
                    key={`${table.name}-${col.name}`}
                    className={pcn(
                        '__col-header',
                        isLiveOrLinkColumn ? '__col-header--live' : '',
                        isLinkColumn ? '__col-header--live-link' : '',
                        isPrimaryKey ? '__col-header--primary' : '',
                    )}>
                    { icon &&
                        <span
                            className={pcn('__col-header-type-icon', `__col-header-type-icon--${mod}`)}
                            dangerouslySetInnerHTML={{ __html: icon }}>
                        </span>
                    }
                    { !icon && isLiveOrLinkColumn && !isLinkColumn && (givenStatus === tableStatus.IN_SYNC.id || !isFirstSeed.current) &&
                        <span className='blink-indicator'><span></span></span>
                    }
                    { !icon && isLiveOrLinkColumn && !isLinkColumn && (givenStatus !== tableStatus.IN_SYNC.id && isFirstSeed.current) &&
                        <span className={pcn('__col-header-type-icon', `__col-header-type-icon--circle`)}><span></span></span>
                    }
                    <span className={pcn('__col-header-name')}>{col.name}</span>
                    <span className={pcn('__col-header-type')}>
                        <span>{ colType }</span>
                    </span>
                </div>
            ))
        })
        
        colHeaders.push((
            <div key='add' className={pcn('__col-header', '__col-header--new-col')}>
                <span id='extendTableDropdownTarget' onClick={() => showLiveDataPanel(referrers.NEW_LIVE_COLUMN)}>
                    <span>+</span>
                </span>
                <NewColumnDropdown
                    key='extendTableDropdown'
                    id='extendTableDropdown'
                    onSelectOption={onSelectNewColumnType}
                    ref={extendTableDropdownRef}
                />
            </div>
        ))

        return colHeaders
    }, [table, liveColumns, onSelectNewColumnType, onClickExtendTable])

    const renderRecords = useCallback((givenStatus) => records?.map((record, i) => {
        const cells = [(
            <div key='check' className={pcn('__cell', '__cell--check-col')}>
                <span></span>
            </div>
        )]

        table.columns.forEach(col => {
            let value = record[col.name]
            if (value === null || !record.hasOwnProperty(col.name)) {
                value = 'NULL'
            } else if (value === true || value === false) {
                value = value.toString()
            } else if (isJSONColumn(col)) {
                value = stringify(value)
            } else if (value == 0) {
                value = value
            }
            else if (!value) {
                value = ''
            }

            const liveColumnData = liveColumns[col.name]
            const isLiveOrLinkColumn = !!liveColumnData
            const isLinkColumn = liveColumnData?.isLinkColumn
            const isPrimaryKey = primaryKeyColNames.has(col.name)

            cells.push((
                <div
                    key={`${table.name}-${col.name}`}
                    className={pcn(
                        '__cell', 
                        isLiveOrLinkColumn ? '__cell--live' : '',
                        isLinkColumn ? '__cell--live-link' : '',
                        value === 'NULL' ? '__cell--null' : '',
                        isPrimaryKey ? '__cell--primary' : '',
                    )}>
                    <span>
                        <Flipper value={value}/>
                    </span>
                </div>
            ))
        })

        cells.push((<div key='empty' className={pcn('__cell')}></div>))

        const isNew = fadeInRowIndexesRange.current 
            && fadeInRowIndexesRange.current.length 
            && i >= fadeInRowIndexesRange.current[0] 
            && i <= fadeInRowIndexesRange.current[1]

        const delay = (isNew ? Math.max((i - fadeInRowIndexesRange.current[0]), 0) : 0) * timing.rowFadeInDelay
        const useNewAccent = givenStatus === tableStatus.IN_SYNC.id && !isFirstSeed.current

        return (
            <div
                key={i}
                className={pcn(
                    '__row',
                    isNew  ? '__row--new' : '',
                    isNew && useNewAccent ? '__row--new-accent' : ''
                )}
                style={ isNew 
                    ? { 
                        transition: `opacity 0.25s ease ${delay}ms`, 
                        gridTemplateColumns: gridTemplateColumnsValue,
                        ...(useNewAccent ? { opacity: 0 } : {}),
                    } 
                    : { 
                        gridTemplateColumns: gridTemplateColumnsValue,
                    } 
                }>
                { cells }
            </div>
        )
    }) || [], [table, records, count, hasLiveColumns, liveColumns, gridTemplateColumnsValue])

    const renderTableLoading = useCallback(() => {
        let maxWidth = mainWidth
        if (mainRef.current) {
            maxWidth = Math.min(mainRef.current.offsetWidth, maxWidth)
        }
        return (
            <div className={pcn('__table-loading')} style={{ maxWidth: `${maxWidth}px` }}>
                <div className='indeterminate'></div>
            </div>
        )
    }, [mainWidth])

    const renderEmptySchema = useCallback(() => (
        <div className={pcn('__empty')}>
            <div className={pcn('__empty-liner')}>
                <div
                    className={pcn('__empty-icon')}
                    dangerouslySetInnerHTML={{ __html: specIcon }}>
                </div>
                <div className={pcn('__empty-text')}>
                    <div>Your Postgres instance is empty.</div>
                    <div>Let's change that.</div>
                </div>
                <button
                    className={pcn('__empty-button')}
                    onClick={() => showLiveDataPanel(referrers.NEW_LIVE_TABLE)}>
                    <span>New Live Table</span>
                </button>
            </div>
        </div>
    ), [showLiveDataPanel])

    return (
        <div className={cn(
            className,
            `${className}--${status}`,
            records === null ? `${className}--loading` : '',
        )} ref={tablesBodyRef}>
            {tablesLoaded && !table?.name && renderEmptySchema() }
            { table?.name && (
                <div className={pcn('__header')}>
                    <div className={pcn('__header-left')}>
                        <div className={pcn('__header-left-liner')}>
                            <div className={pcn('__header-left-top')}>
                                <div className={pcn('__table-name')}>
                                    <span>{ table.name }</span>
                                </div>
                                <div className={pcn('__table-desc')}>
                                    <span>{ 'lido.HashConsensus.ReportReceived events' || table.comment || <i>No description</i> }</span>
                                </div>
                            </div>
                            <div className={pcn('__header-left-bottom')}>
                                { hasLiveColumns && renderStatus() }
                                { renderNumRecords('header') }
                                { renderFilterButton() }
                                { renderSortButton() }
                                { renderLinkObjectButton() }
                            </div>
                        </div>
                    </div>
                </div>
            )}
            { table?.name && (
                <div className={pcn('__main')} onScroll={onScroll} ref={mainRef}>
                    { status === tableStatus.BACKFILLING.id && isFirstSeed.current && renderTableLoading() }
                    <div style={{ height: 'auto', width: mainWidth + ROW_HEIGHT + 150 }}>
                        <div className={pcn('__col-headers')} style={{ gridTemplateColumns: gridTemplateColumnsValue }}>
                            { renderColHeaders(status) }
                        </div>
                        <div className={pcn('__records')} ref={recordsRef}>
                            { renderRecords(status) }
                        </div>
                    </div>
                </div>
            )}
            <Slider
                id='newLiveColumnSlider'
                ref={newLiveColumnSliderRef}
                onShown={onNewLiveColumnSliderShown}>
                <NewLiveColumnPanel
                    table={table}
                    schema={schema}
                    config={config}
                    tableLiveColumns={liveColumns}
                    referrer={liveDataPanelReferrer}
                    onSave={onSaveLiveColumns}
                    onCancel={() => newLiveColumnSliderRef.current?.hide()}
                    addTransform={addTransform}
                    addHook={addHook}
                    refetchTables={refetchTables}
                    editColumn={showEditColumnSlider}
                    ref={newLiveColumnPanelRef}
                />
            </Slider>
            <Slider
                id='editColumnSlider'
                faster={true}
                willHide={() => editColumnPanelRef.current?.willHide()}
                ref={editColumnSliderRef}>
                <EditColumnPanel
                    schema={schema}
                    onCancel={() => editColumnSliderRef.current?.hide()}
                    onDone={() => editColumnSliderRef.current?.hide()}
                    ref={r => {
                        editColumnPanelRef.current = r
                        if (editColumnPanelRef.current && !!configureEditColumnPanelArgs.current?.length) {
                            editColumnPanelRef.current.configure(...configureEditColumnPanelArgs.current)
                            configureEditColumnPanelArgs.current = []
                        }
                    }}
                />
            </Slider>
        </div>
    )
}

TablesBody = forwardRef(TablesBody)
export default TablesBody