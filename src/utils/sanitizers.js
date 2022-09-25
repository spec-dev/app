export const secureText = val => val ? val.replace( /[<>"`]/g, '' ) : ''
