import XEUtils from 'xe-utils'

function getFormatDate (value, props, defaultFormat) {
  return XEUtils.toDateString(value, props.format || defaultFormat)
}

function getFormatDates (values, props, separator, defaultFormat) {
  return XEUtils.map(values, date => getFormatDate(date, props, defaultFormat)).join(separator)
}

function equalDaterange (cellValue, data, props, defaultFormat) {
  cellValue = getFormatDate(cellValue, props, defaultFormat)
  return cellValue >= getFormatDate(data[0], props, defaultFormat) && cellValue <= getFormatDate(data[1], props, defaultFormat)
}

function matchCascaderData (index, list, values, labels) {
  let val = values[index]
  if (list && values.length > index) {
    XEUtils.each(list, item => {
      if (item.value === val) {
        labels.push(item.label)
        matchCascaderData(++index, item.children, values, labels)
      }
    })
  }
}

function getProps ({ $table }, { props }) {
  return XEUtils.assign($table.vSize ? { size: $table.vSize } : {}, props)
}

function getCellEvents (renderOpts, params) {
  let { name, events } = renderOpts
  let { $table } = params
  let type = 'change'
  switch (name) {
    case 'ElAutocomplete':
      type = 'select'
      break
    case 'ElInput':
    case 'ElInputNumber':
      type = 'input'
      break
  }
  let on = {
    [type]: () => $table.updateStatus(params)
  }
  if (events) {
    XEUtils.assign(on, XEUtils.objectMap(events, cb => function () {
      cb.apply(null, [params].concat.apply(params, arguments))
    }))
  }
  return on
}

function defaultCellRender (h, renderOpts, params) {
  let { row, column } = params
  let { attrs } = renderOpts
  let props = getProps(params, renderOpts)
  return [
    h(renderOpts.name, {
      props,
      attrs,
      model: {
        value: XEUtils.get(row, column.property),
        callback (value) {
          XEUtils.set(row, column.property, value)
        }
      },
      on: getCellEvents(renderOpts, params)
    })
  ]
}

function getFilterEvents (on, renderOpts, params) {
  let { events } = renderOpts
  if (events) {
    XEUtils.assign(on, XEUtils.objectMap(events, cb => function () {
      cb.apply(null, [params].concat.apply(params, arguments))
    }))
  }
  return on
}

function defaultFilterRender (h, renderOpts, params, context) {
  let { column } = params
  let { name, attrs } = renderOpts
  let props = getProps(params, renderOpts)
  let type = 'change'
  switch (name) {
    case 'ElAutocomplete':
      type = 'select'
      break
    case 'ElInput':
    case 'ElInputNumber':
      type = 'input'
      break
  }
  return column.filters.map(item => {
    return h(name, {
      props,
      attrs,
      model: {
        value: item.data,
        callback (optionValue) {
          item.data = optionValue
        }
      },
      on: getFilterEvents({
        [type] () {
          handleConfirmFilter(context, column, !!item.data, item)
        }
      }, renderOpts, params)
    })
  })
}

function handleConfirmFilter (context, column, checked, item) {
  context[column.filterMultiple ? 'changeMultipleOption' : 'changeRadioOption']({}, checked, item)
}

function defaultFilterMethod ({ option, row, column }) {
  let { data } = option
  let cellValue = XEUtils.get(row, column.property)
  /* eslint-disable eqeqeq */
  return cellValue == data
}

function renderOptions (h, options, optionProps) {
  let labelProp = optionProps.label || 'label'
  let valueProp = optionProps.value || 'value'
  return XEUtils.map(options, (item, index) => {
    return h('el-option', {
      props: {
        value: item[valueProp],
        label: item[labelProp]
      },
      key: index
    })
  })
}

function cellText (h, cellValue) {
  return ['' + (cellValue === null || cellValue === void 0 ? '' : cellValue)]
}

/**
 * 渲染函数
 */
const renderMap = {
  ElAutocomplete: {
    autofocus: 'input.el-input__inner',
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  },
  ElInput: {
    autofocus: 'input.el-input__inner',
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  },
  ElInputNumber: {
    autofocus: 'input.el-input__inner',
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  },
  ElSelect: {
    renderEdit (h, renderOpts, params) {
      let { options, optionGroups, optionProps = {}, optionGroupProps = {} } = renderOpts
      let { row, column } = params
      let { attrs } = renderOpts
      let props = getProps(params, renderOpts)
      if (optionGroups) {
        let groupOptions = optionGroupProps.options || 'options'
        let groupLabel = optionGroupProps.label || 'label'
        return [
          h('el-select', {
            props,
            attrs,
            model: {
              value: XEUtils.get(row, column.property),
              callback (cellValue) {
                XEUtils.set(row, column.property, cellValue)
              }
            },
            on: getCellEvents(renderOpts, params)
          }, XEUtils.map(optionGroups, (group, gIndex) => {
            return h('el-option-group', {
              props: {
                label: group[groupLabel]
              },
              key: gIndex
            }, renderOptions(h, group[groupOptions], optionProps))
          }))
        ]
      }
      return [
        h('el-select', {
          props,
          attrs,
          model: {
            value: XEUtils.get(row, column.property),
            callback (cellValue) {
              XEUtils.set(row, column.property, cellValue)
            }
          },
          on: getCellEvents(renderOpts, params)
        }, renderOptions(h, options, optionProps))
      ]
    },
    renderCell (h, renderOpts, params) {
      let { options, optionGroups, props = {}, optionProps = {}, optionGroupProps = {} } = renderOpts
      let { row, column } = params
      let labelProp = optionProps.label || 'label'
      let valueProp = optionProps.value || 'value'
      let groupOptions = optionGroupProps.options || 'options'
      let cellValue = XEUtils.get(row, column.property)
      if (!(cellValue === null || cellValue === undefined || cellValue === '')) {
        return cellText(h, XEUtils.map(props.multiple ? cellValue : [cellValue], optionGroups ? value => {
          let selectItem
          for (let index = 0; index < optionGroups.length; index++) {
            selectItem = XEUtils.find(optionGroups[index][groupOptions], item => item[valueProp] === value)
            if (selectItem) {
              break
            }
          }
          return selectItem ? selectItem[labelProp] : null
        } : value => {
          let selectItem = XEUtils.find(options, item => item[valueProp] === value)
          return selectItem ? selectItem[labelProp] : null
        }).join(';'))
      }
      return cellText(h, '')
    },
    renderFilter (h, renderOpts, params, context) {
      let { options, optionGroups, optionProps = {}, optionGroupProps = {} } = renderOpts
      let { column } = params
      let { attrs } = renderOpts
      let props = getProps(params, renderOpts)
      if (optionGroups) {
        let groupOptions = optionGroupProps.options || 'options'
        let groupLabel = optionGroupProps.label || 'label'
        return column.filters.map(item => {
          return h('el-select', {
            props,
            attrs,
            model: {
              value: item.data,
              callback (optionValue) {
                item.data = optionValue
              }
            },
            on: getFilterEvents({
              change (value) {
                handleConfirmFilter(context, column, value && value.length > 0, item)
              }
            }, renderOpts, params)
          }, XEUtils.map(optionGroups, (group, gIndex) => {
            return h('el-option-group', {
              props: {
                label: group[groupLabel]
              },
              key: gIndex
            }, renderOptions(h, group[groupOptions], optionProps))
          }))
        })
      }
      return column.filters.map(item => {
        return h('el-select', {
          props,
          attrs,
          model: {
            value: item.data,
            callback (optionValue) {
              item.data = optionValue
            }
          },
          on: getFilterEvents({
            change (value) {
              handleConfirmFilter(context, column, value && value.length > 0, item)
            }
          }, renderOpts, params)
        }, renderOptions(h, options, optionProps))
      })
    },
    filterMethod ({ option, row, column }) {
      let { data } = option
      let { property, filterRender: renderOpts } = column
      let { props = {} } = renderOpts
      let cellValue = XEUtils.get(row, property)
      if (props.multiple) {
        if (XEUtils.isArray(cellValue)) {
          return XEUtils.includeArrays(cellValue, data)
        }
        return data.indexOf(cellValue) > -1
      }
      /* eslint-disable eqeqeq */
      return cellValue == data
    }
  },
  ElCascader: {
    renderEdit: defaultCellRender,
    renderCell (h, { props = {} }, params) {
      let { row, column } = params
      let cellValue = XEUtils.get(row, column.property)
      var values = cellValue || []
      var labels = []
      matchCascaderData(0, props.options, values, labels)
      return cellText(h, (props.showAllLevels === false ? labels.slice(labels.length - 1, labels.length) : labels).join(` ${props.separator || '/'} `))
    }
  },
  ElDatePicker: {
    renderEdit: defaultCellRender,
    renderCell (h, { props = {} }, params) {
      let { row, column } = params
      let { rangeSeparator = '-' } = props
      let cellValue = XEUtils.get(row, column.property)
      switch (props.type) {
        case 'week':
          cellValue = getFormatDate(cellValue, props, 'yyyywWW')
          break
        case 'month':
          cellValue = getFormatDate(cellValue, props, 'yyyy-MM')
          break
        case 'year':
          cellValue = getFormatDate(cellValue, props, 'yyyy')
          break
        case 'dates':
          cellValue = getFormatDates(cellValue, props, ', ', 'yyyy-MM-dd')
          break
        case 'daterange':
          cellValue = getFormatDates(cellValue, props, ` ${rangeSeparator} `, 'yyyy-MM-dd')
          break
        case 'datetimerange':
          cellValue = getFormatDates(cellValue, props, ` ${rangeSeparator} `, 'yyyy-MM-dd HH:ss:mm')
          break
        case 'monthrange':
          cellValue = getFormatDates(cellValue, props, ` ${rangeSeparator} `, 'yyyy-MM')
          break
        default:
          cellValue = getFormatDate(cellValue, props, 'yyyy-MM-dd')
      }
      return cellText(h, cellValue)
    },
    renderFilter (h, renderOpts, params, context) {
      let { column } = params
      let { attrs } = renderOpts
      let props = getProps(params, renderOpts)
      return column.filters.map(item => {
        return h(renderOpts.name, {
          props,
          attrs,
          model: {
            value: item.data,
            callback (optionValue) {
              item.data = optionValue
            }
          },
          on: getFilterEvents({
            change (value) {
              handleConfirmFilter(context, column, !!value, item)
            }
          }, renderOpts, params)
        })
      })
    },
    filterMethod ({ option, row, column }) {
      let { data } = option
      let { filterRender: renderOpts } = column
      let { props = {} } = renderOpts
      let cellValue = XEUtils.get(row, column.property)
      if (data) {
        switch (props.type) {
          case 'daterange':
            return equalDaterange(cellValue, data, props, 'yyyy-MM-dd')
          case 'datetimerange':
            return equalDaterange(cellValue, data, props, 'yyyy-MM-dd HH:ss:mm')
          case 'monthrange':
            return equalDaterange(cellValue, data, props, 'yyyy-MM')
          default:
            return cellValue === data
        }
      }
      return false
    }
  },
  ElTimePicker: {
    renderEdit: defaultCellRender,
    renderCell (h, { props = {} }, params) {
      let { row, column } = params
      let { isRange, format = 'hh:mm:ss', rangeSeparator = '-' } = props
      let cellValue = XEUtils.get(row, column.property)
      if (cellValue && isRange) {
        cellValue = XEUtils.map(cellValue, date => XEUtils.toDateString(date, format)).join(` ${rangeSeparator} `)
      }
      return XEUtils.toDateString(cellValue, format)
    }
  },
  ElTimeSelect: {
    renderEdit: defaultCellRender
  },
  ElRate: {
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  },
  ElSwitch: {
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  },
  ElSlider: {
    renderDefault: defaultCellRender,
    renderEdit: defaultCellRender,
    renderFilter: defaultFilterRender,
    filterMethod: defaultFilterMethod
  }
}

/**
 * 事件兼容性处理
 */
function handleClearEvent (params, evnt, context) {
  let { getEventTargetNode } = context
  let bodyElem = document.body
  if (
    // 远程搜索
    getEventTargetNode(evnt, bodyElem, 'el-autocomplete-suggestion').flag ||
    // 下拉框
    getEventTargetNode(evnt, bodyElem, 'el-select-dropdown').flag ||
    // 级联
    getEventTargetNode(evnt, bodyElem, 'el-cascader__dropdown').flag ||
    getEventTargetNode(evnt, bodyElem, 'el-cascader-menus').flag ||
    // 日期
    getEventTargetNode(evnt, bodyElem, 'el-picker-panel').flag
  ) {
    return false
  }
}

export const VXETablePluginElement = {
  install ({ interceptor, renderer }) {
    // 添加到渲染器
    renderer.mixin(renderMap)
    // 处理事件冲突
    interceptor.add('event.clear_filter', handleClearEvent)
    interceptor.add('event.clear_actived', handleClearEvent)
  }
}

if (typeof window !== 'undefined' && window.VXETable) {
  window.VXETable.use(VXETablePluginElement)
}

export default VXETablePluginElement
