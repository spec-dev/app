export const trueOp = val => true

export const notNull = val => val !== null

export const isArray = val => Array.isArray( val )

export const nonEmptyArray = val => isArray( val ) && val.length > 0

export const nonEmptyString = val => ( typeof val === 'string' && val !== '' )

export const nonEmptyStringWhenTrimmed = val => ( typeof val === 'string' && val.trim() !== '' )

export const nonNegativeNumber = val => ( typeof val === 'number' && val >= 0 )

export const nonEmptyObject = val => ( typeof val === 'object' && !!val && Object.keys( val ).length > 0 )

export const positiveNumber = val => ( typeof val === 'number' && val > 0 )

export const isName = val => !!( ( val || '' ).match( /^([a-zA-Z- .\']+?) ([a-zA-Z-.\']+)(,? (?:[JS]r\.?|III?|IV))?$/i ) )

export const isValidFSName = (val = '') => val.match(/^[A-Za-z0-9-_+.]+$/g) !== null

export const isValidNameComp = val => nonEmptyStringWhenTrimmed( val ) && !!val.match( /^[a-zA-Z- \']+$/i )

export const isEmail = val => !!( ( val || '' ).match( /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ ) )

export const isPhoneNumber = val => !!( ( val || '' ).match(/[0-9]+/) ) && val.length === 10

export const isValidNumber = val => !Number.isNaN( Number( val ) )

export const isValidPassword = val => {
    val = val || ''
    const meetsLengthReq = val.length >= 8
    const hasLowercaseLetter = !!val.match( /[a-z]/ )
    const hasUppercaseLetter = !!val.match( /[A-Z]/ )
    const hasNum = !!val.match( /[0-9]/ )
    const hasSymbol = !!val.match( /[~!@#$%^&*_+={}|:;?\/-]/ )
    const hasRestrictedChar = !!val.match( /[`'"<>\[\]()\\ ]/ )

    return meetsLengthReq &&
        hasUppercaseLetter &&
        hasLowercaseLetter &&
        hasNum && hasSymbol &&
        !hasRestrictedChar
}

export const isDomain = val => !!( ( val || '' ).match( /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/ ) )
