'use strict'

const { filterObject, isEmpty, uid } = require('../lib/functional')

describe('filterObject(value, callbackFn)', () => {
  test('nullish argument, expect TypeError', () => {
    expect(() => filterObject(null)).toThrow(TypeError)
  })

  test('default `callbackFn`, expect Object without empty values', () => {
    expect(
      filterObject({
        key1: 0,
        key2: 'str',
        key3: [0, 1, 2],
        key4: null,
        key5: undefined,
        key6: [],
        key7: {},
        key8: ''
      })
    ).toEqual({ key1: 0, key2: 'str', key3: [0, 1, 2] })
  })

  test('all elements fail test, expect empty object', () => {
    const fn = jest.fn().mockReturnValue(false)
    expect(filterObject({ key1: 1, key2: 2, key3: 3 }, fn)).toEqual({})
    expect(fn).toHaveBeenNthCalledWith(1, 1, 'key1')
    expect(fn).toHaveBeenNthCalledWith(2, 2, 'key2')
    expect(fn).toHaveBeenNthCalledWith(3, 3, 'key3')
  })

  test('all elements passed test, expect copy of input', () => {
    const input = { key1: 1, key2: 2, key3: 3 }
    const fn = jest.fn().mockReturnValue(true)
    const filtered = filterObject(input, fn)
    expect(filtered).not.toBe(input)
    expect(filtered).toEqual(input)
    expect(fn).toHaveBeenNthCalledWith(1, 1, 'key1')
    expect(fn).toHaveBeenNthCalledWith(2, 2, 'key2')
    expect(fn).toHaveBeenNthCalledWith(3, 3, 'key3')
  })
})

describe('isEmpty(value)', () => {
  test.each([
    undefined,
    null,
    '',
    parseInt('str'),
    new Set(),
    new Map(),
    [],
    {}
  ])("isEmpty('%s'), expect true", value => {
    expect(isEmpty(value)).toBe(true)
  })

  test.each([
    0,
    'string',
    new Set([null]),
    new Map([[null, null]]),
    [null],
    { null: null }
  ])("isEmpty('%s'), expect false", value => {
    expect(isEmpty(value)).toBe(false)
  })
})

describe('uid(length)', () => {
  test('invalid argument type, throws TypeError', () => {
    expect(() => uid('1')).toThrow(
      new TypeError("length expected 'number', got 'string'")
    )
  })

  test('invalid argument value, throws Error', () => {
    expect(() => uid(0)).toThrow('length expected natural number, got 0')
  })

  test('valid argument, expect string', () => {
    const value = uid(100)
    expect(value).toEqual(expect.any(String))
    expect(value.length).toBe(100)
  })
})
