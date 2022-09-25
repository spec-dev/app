const flowDiagram = `<svg width="1207px" height="329px" viewBox="0 0 1207 329">
    <defs>
        <circle id="path-1" cx="24.5" cy="24.5" r="24.5"></circle>
        <linearGradient x1="25.9614422%" y1="17.2133881%" x2="93.0873927%" y2="51.2403673%" id="linearGradient-3">
            <stop stop-color="#F213A4" offset="0%"></stop>
            <stop stop-color="#E011A7" offset="15.17%"></stop>
            <stop stop-color="#B20DAF" offset="45.54%"></stop>
            <stop stop-color="#6806BB" offset="87.89%"></stop>
            <stop stop-color="#5204BF" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="31.141857%" y1="17.2133674%" x2="85.0409628%" y2="46.9389658%" id="linearGradient-4">
            <stop stop-color="#F213A4" offset="0%"></stop>
            <stop stop-color="#E011A7" offset="15.17%"></stop>
            <stop stop-color="#B20DAF" offset="45.54%"></stop>
            <stop stop-color="#6806BB" offset="87.89%"></stop>
            <stop stop-color="#5204BF" offset="100%"></stop>
        </linearGradient>
        <linearGradient id="lg" x1="-100%" y1="0" x2="200%" y2="0" >
            <stop offset="0" stop-color="red">
            <animate attributeName="offset" values="0;0.2;0.5" dur="2s" repeatCount="indefinite"  /> 
            </stop>
            <stop offset="0.5" stop-color="yellow">
                <animate attributeName="offset" values="0.5;0.7;0.8;1" dur="2s" repeatCount="indefinite"  /> 
            </stop>
        </linearGradient>
    </defs>
    <g id="Exports" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Group-12">
            <rect id="Rectangle" fill-opacity="0.0488144668" fill="#5ACCF8" x="309" y="151" width="145" height="28" rx="14"></rect>
            <g id="Group-5" transform="translate(585.000000, 138.000000)">
                <g id="Oval-2">
                    <mask id="mask-2" fill="white">
                        <use xlink:href="#path-1"></use>
                    </mask>
                    <use id="Oval" fill="#FFFFFF" xlink:href="#path-1"></use>
                </g>
                <g id="thirdweb" transform="translate(10.000000, 18.000000)" fill-rule="nonzero">
                    <path d="M0.0827968507,1.34621408 C-0.219753381,0.699105365 0.344090607,0 1.16922659,0 L6.29198407,0 C6.77329392,0 7.1995818,0.242665146 7.37841792,0.618216152 L11.4559286,9.23859114 C11.5659725,9.46973167 11.5659725,9.72968998 11.4559286,9.966614 L8.89113966,15.380318 C8.49921844,16.2065607 7.11019316,16.2065607 6.71827195,15.380318 L0.0827968507,1.34621408 Z" id="Path" fill="url(#linearGradient-3)"></path>
                    <path d="M9.62901434,1.33651126 C9.36147554,0.685841107 9.90989,0 10.6991123,0 L15.039892,0 C15.5214504,0 15.9494895,0.263784652 16.1099899,0.656532825 L19.7150093,9.40247513 C19.8019566,9.61932809 19.8019566,9.85970254 19.7150093,10.0824232 L17.547968,15.3405637 C17.1868422,16.2198121 15.768898,16.2198121 15.4077149,15.3405637 L9.62901434,1.33651126 Z" id="Path" fill="url(#linearGradient-4)"></path>
                    <path d="M18.5443299,1.34621408 C18.2417971,0.699105365 18.8056109,0 19.6307644,0 L24.7535192,0 C25.2348294,0 25.6611764,0.242665146 25.8399538,0.618216152 L29.917467,9.23859114 C30.027511,9.46973167 30.027511,9.72968998 29.917467,9.966614 L27.3526765,15.380318 C26.960755,16.2065607 25.5717877,16.2065607 25.1798074,15.380318 L18.5443299,1.34621408 Z" id="Path" fill="url(#linearGradient-3)"></path>
                </g>
            </g>
            <text id="Listing-{}" font-family="SFMonoRegular" font-size="13" font-weight="400" fill="#FFFFFF">
                <tspan x="575" y="217">Listing {}</tspan>
            </text>
            <text id="ListingChanged" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal" fill="#5ACCF8">
                <tspan x="337" y="168">ListingChanged</tspan>
            </text>
            <g id="Group-7" fill="#5ACCF8">
                <rect id="Rectangle" fill-opacity="0.0488144668" x="0" y="0" width="141" height="28" rx="14"></rect>
                <text id="ListingAdded" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal">
                    <tspan x="31" y="17">ListingAdded</tspan>
                </text>
            </g>
            <g id="Group-7" transform="translate(0.000000, 148.000000)" fill="#5ACCF8">
                <rect id="Rectangle" fill-opacity="0.0488144668" x="0" y="0" width="141" height="28" rx="14"></rect>
                <text id="ListingUpdated" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal">
                    <tspan x="30" y="17">ListingUpdated</tspan>
                </text>
            </g>
            <g id="Group-7" transform="translate(0.000000, 301.000000)" fill="#5ACCF8">
                <rect id="Rectangle" fill-opacity="0.0488144668" x="0" y="0" width="141" height="28" rx="14"></rect>
                <text id="ListingRemoved" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal">
                    <tspan x="30" y="17">ListingRemoved</tspan>
                </text>
            </g>
            <path d="M150.5,161.315385 C150.5,239.815385 300.5,239.815385 300.5,318.315385" id="Path" stroke-opacity="0.9" stroke="#5ACCF8" opacity="0.216796875" transform="translate(225.500000, 239.815385) rotate(90.000000) translate(-225.500000, -239.815385) "></path>
            <path class="function-path" d="M796.082447,-89.1021686 C796.082447,113.315385 899.082447,113.315385 899.082447,315.732938" id="Path" stroke-opacity="0.64215472" stroke="#39DAD6" opacity="0.25" transform="translate(847.582447, 113.315385) rotate(90.000000) translate(-847.582447, -113.315385) "></path>
            <path class="function-path" d="M796.458777,11.356608 C796.458777,214.315385 895.458777,214.315385 895.458777,417.274161" id="Path" stroke-opacity="0.64215472" stroke="#39DAD6" opacity="0.25" transform="translate(845.958777, 214.315385) scale(1, -1) rotate(90.000000) translate(-845.958777, -214.315385) "></path>
            <path d="M150.5,10.3153846 C150.5,88.8153846 300.5,88.8153846 300.5,167.315385" id="Path" stroke-opacity="0.9" stroke="#5ACCF8" opacity="0.216796875" transform="translate(225.500000, 88.815385) scale(1, -1) rotate(90.000000) translate(-225.500000, -88.815385) "></path>
            <line x1="146.5" y1="164.5" x2="303.5" y2="164.5" id="Line-4" stroke-opacity="0.9" stroke="#5ACCF8" opacity="0.216796875" stroke-linecap="square"></line>
            <line x1="460.5" y1="165.5" x2="574.5" y2="164.5" id="Line-4" stroke-opacity="0.9" stroke="#5ACCF8" opacity="0.216796875" stroke-linecap="square"></line>
            <g id="Group-4" transform="translate(1059.000000, 47.000000)">
                <rect id="Rectangle" fill-opacity="0.0523656031" fill="#39DAD6" x="0" y="0" width="123" height="28" rx="14"></rect>
                <text id="getListing" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal" fill="#44FFD5">
                    <tspan x="31" y="17">getListing</tspan>
                </text>
                <text id="()" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal" fill="#39DAD6" fill-opacity="0.524557474">
                    <tspan x="9.98540146" y="17">()</tspan>
                </text>
            </g>
            <g id="Group-4" transform="translate(1057.000000, 249.000000)">
                <rect id="Rectangle" fill-opacity="0.0523656031" fill="#39DAD6" x="0" y="0" width="150" height="28" rx="14"></rect>
                <text id="getAllListings" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal" fill="#44FFD5">
                    <tspan x="35" y="17">getAllListings</tspan>
                </text>
                <text id="()" font-family="SFMonoRegular, SF Mono" font-size="11" font-weight="normal" fill="#39DAD6" fill-opacity="0.524557474">
                    <tspan x="12.9854015" y="18">()</tspan>
                </text>
            </g>
        </g>
    </g>
</svg>`

export default flowDiagram