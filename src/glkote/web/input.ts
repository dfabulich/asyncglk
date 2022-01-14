/*

GlkOte input handlers
=====================

Copyright (c) 2022 Dannii Willis
MIT licenced
https://github.com/curiousdannii/asyncglk

*/

import {KEY_CODES_TO_NAMES, KEY_NAMES_TO_CODES, OFFSCREEN_OFFSET} from '../../common/constants.js'
import * as protocol from '../../common/protocol.js'

import WindowManager, {Window} from './windows.js'

export class TextInput {
    el: JQuery<HTMLElement>
    is_line = false
    window: Window
    window_manager: WindowManager

    constructor(window: Window, manager: WindowManager) {
        this.window = window
        this.window_manager = manager

        this.el = $('<input>', {
            'aria-live': 'off',
            autocapitalize: 'off',
            class: 'Input',
            type: 'text',
        })
        window.frameel.append(this.el)
    }

    destroy() {
        this.el.remove()
    }

    private onkeydown(ev: JQuery.KeyDownEvent) {
        // This input shouldn't be active
        if (!this.window.inputs?.type) {
            this.el.trigger('blur')
            return false
        }

        const keycode = ev.which
        if (!keycode) {
            return
        }

        // TODO: Don't capture up/down/pageup/pagedown if input is not in view

        if (this.is_line) {
            // History
            if (keycode === KEY_NAMES_TO_CODES.down || keycode === KEY_NAMES_TO_CODES.up) {
                // TODO
            }

            // Terminator for this input
            else if (this.window.inputs!.terminators) {
                const terminator = KEY_CODES_TO_NAMES[keycode] as protocol.TerminatorCode
                if (this.window.inputs!.terminators.includes(KEY_CODES_TO_NAMES[keycode] as protocol.TerminatorCode)) {
                    this.submit_line(ev.target.value, terminator)
                    return false
                }
            }
        }
        // Character input
        else {
            const code = KEY_CODES_TO_NAMES[keycode]
            if (code) {
                this.submit_char(code)
                return false
            }
        }

        // Don't propagate, so that document.keydown doesn't trigger
        ev.stopPropagation()
    }

    private onkeypress(ev: JQuery.KeyPressEvent) {
        // This input shouldn't be active
        if (!this.window.inputs?.type) {
            this.el.trigger('blur')
            return false
        }

        const keycode = ev.which
        if (!keycode) {
            return
        }

        // Submit line input
        if (this.is_line) {
            if (keycode === KEY_NAMES_TO_CODES.return) {
                this.submit_line(ev.target.value)
                return false
            }
        }
        // Character input
        else {
            const code = keycode === KEY_NAMES_TO_CODES.return ? 'return' : String.fromCharCode(keycode)
            this.submit_char(code)
            return false
        }
    }

    /** Refocus the input, but without scrolling */
    refocus() {
        this.el[0].focus({preventScroll: true})
    }

    reset() {
        this.el
            .css('left', OFFSCREEN_OFFSET)
            .off('keydown keypress')
            .val('')
        if (!this.el.parent().is(this.window.frameel)) {
            this.el.appendTo(this.window.frameel)
        }
    }

    private submit_char(val: string) {
        this.reset()
        this.window_manager.active_window = this.window
        this.window_manager.send_event({
            type: 'char',
            value: val,
            window: this.window.id,
        })
    }

    private submit_line(val: string, terminator?: protocol.TerminatorCode) {
        this.reset()
        this.window_manager.active_window = this.window

        // TODO: history

        this.window_manager.send_event({
            type: 'line',
            terminator,
            value: val,
            window: this.window.id,
        })
    }

    update() {
        const update = this.window.inputs!
        if (update.type !== 'char' && update.type !== 'line') {
            this.reset()
            return
        }
        this.is_line = update.type === 'line'

        this.el
            .attr({
                maxlength: this.is_line ? update.maxlen! : 1
            })
            .on('keydown', (ev: JQuery.KeyDownEvent) => this.onkeydown(ev))
            .on('keypress', (ev: JQuery.KeyPressEvent) => this.onkeypress(ev))

        // Stop here on character input
        if (!this.is_line) {
            return
        }
        if (this.window.type === 'graphics') {
            throw new Error(`Cannot request line input in graphics window ${this.window.id}`)
        }

        // Position the input element within the window
        switch (this.window.type) {
            case 'buffer':
                (this.window.lastline || this.window.frameel).append(this.el)
                break
            case 'grid':
                // TODO
                return
                break
        }
        this.el.val(update.initial || '')

        // TODO: set colours and reverse
    }
}