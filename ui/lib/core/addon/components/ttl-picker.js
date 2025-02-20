import { typeOf } from '@ember/utils';
import EmberError from '@ember/error';
import Component from '@ember/component';
import { set, computed } from '@ember/object';
import Duration from '@icholy/duration';
import layout from '../templates/components/ttl-picker';

const ERROR_MESSAGE = 'TTLs must be specified in whole number increments, please enter a whole number.';

/**
 * @module TtlPicker
 * `TtlPicker` components are used to set the 'time to live'.
 * This version is being deprecated and replaced by `TtlPicker2` which is an automatic-width version that
 * automatically recalculates the time value when unit is updated unless time has been changed recently.
 * Once all instances of TtlPicker are replaced with TtlPicker2, this component will be removed and
 * TtlPicker2 will be renamed to TtlPicker.
 *
 * @example
 * ```js
    <TtlPicker @labelText="Lease" @initialValue={{lease}} @onChange={{action (mut lease)}} />
 * ```
 *
 * @param labelClass="" {String} - A CSS class to add to the label.
 * @param labelText="TTL" {String} - The text content of the label associated with the widget.
 * @param initialValue=null {Number} - The starting value of the TTL;
 * @param setDefaultValue=true {Boolean} - If true, the component will trigger onChange on the initial
 * render, causing a value to be set.
 * @param onChange=Function.prototype{Function} - The function to call when the value of the ttl changes.
 * @param outputSeconds=false{Boolean} - If true, the component will trigger onChange with a value
 * converted to seconds instead of a Golang duration string.
 */
export default Component.extend({
  layout,
  'data-test-component': 'ttl-picker',
  classNames: 'field',

  onChange: () => {},
  setDefaultValue: true,
  labelText: 'TTL',
  labelClass: '',
  ouputSeconds: false,

  time: 30,
  unit: 'm',
  initialValue: null,
  errorMessage: null,
  unitOptions: computed(function () {
    return [
      { label: 'seconds', value: 's' },
      { label: 'minutes', value: 'm' },
      { label: 'hours', value: 'h' },
      { label: 'days', value: 'd' },
    ];
  }),

  convertToSeconds(time, unit) {
    const toSeconds = {
      s: 1,
      m: 60,
      h: 3600,
    };

    return time * toSeconds[unit];
  },

  TTL: computed('outputSeconds', 'time', 'unit', function () {
    let { time, unit, outputSeconds } = this;
    //convert to hours
    if (unit === 'd') {
      time = time * 24;
      unit = 'h';
    }
    const timeString = time + unit;
    return outputSeconds ? this.convertToSeconds(time, unit) : timeString;
  }),

  didInsertElement() {
    this._super(...arguments);
    if (this.setDefaultValue === false) {
      return;
    }
    this.onChange(this.TTL);
  },

  init() {
    this._super(...arguments);
    if (!this.onChange) {
      throw new EmberError('`onChange` handler is a required attr in `' + this.toString() + '`.');
    }
    if (this.initialValue != undefined) {
      this.parseAndSetTime();
    }
  },

  parseAndSetTime() {
    let value = this.initialValue;
    let seconds = typeOf(value) === 'number' ? value : 30;
    try {
      seconds = Duration.parse(value).seconds();
    } catch (e) {
      // if parsing fails leave as default 30
    }

    this.set('time', seconds);
    this.set('unit', 's');
  },

  actions: {
    changedValue(key, value) {
      if (value && key === 'time') {
        value = parseInt(value, 10);
        if (Number.isNaN(value)) {
          this.set('errorMessage', ERROR_MESSAGE);
          return;
        }
      }
      this.set('errorMessage', null);

      set(this, key, value);
      this.onChange(this.TTL);
    },
  },
});
