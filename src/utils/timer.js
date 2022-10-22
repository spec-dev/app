class Timer {

    constructor( duration = 0 ) {
        this.duration = duration
        this._timer = null
        this._onDone = null
    }

    start = () => {
        this._timer = setTimeout( this._onExpire, this.duration )
    }

    reset = () => {
        if ( this._timer !== null ) {
            clearTimeout( this._timer )
        }

        this.start()
    }

    onDone = onDone => {
        if ( this._timer ) {
            this._onDone = onDone
            return
        }

        onDone()
    }

    _onExpire = () => {
        this._timer = null
        this._onDone && this._onDone()
    }
}

export default Timer
