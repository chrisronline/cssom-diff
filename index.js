import webpage from 'webpage'
import { diff } from 'deep-diff'

const page = webpage.create()
const url1 = 'file:///Users/chrisroberson/Development/hudl/kickoff-css/index.html'//https://github.com/chrisronline/angular-float-labels'
const url2 = 'file:///Users/chrisroberson/Development/hudl/kickoff-css/index2.html'//https://github.com/chrisronline/angular-promise-cache'

const cssdom = () => {
  return () => {

    const getId = node => {
      let cls = '';

      if (node.className) {
        if (typeof node.className === 'string') {
          cls = '.' + node.className.replace(/\s+/g, ':');
        }
        else if (node.className.baseVal) {
          cls = '.' + node.className.baseVal
        }
      }

      const id = node.id ? '#' + node.id : '';
      return node.nodeName.toLowerCase() + id + cls;
    }

    const getParentTree = node => {
      const tree = []
      let parent = node.parentNode
      while (parent != null && parent.nodeName !== 'HTML') {
        tree.push(getId(parent))
        parent = parent.parentNode
      }
      return tree.reverse()
    }

    const getCssom = () => {
      const xpath = document.evaluate(
        '/html/body//*[not(self::style) and not(self::script) and not(self::link) and not(self::noscript)]',
        document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

      const map = {}
      let node = xpath.iterateNext()
      while (node) {
        const tree = getParentTree(node).slice()
        tree.push(getId(node))

        const key = btoa(tree.join('::'))
        const computedStyles = getComputedStyle(node, null) // TODO: handle psuedos
        const styles = {}
        for (let computedStyleKey in computedStyles) {
          if (isNaN(computedStyleKey)) {
            styles[computedStyleKey] = computedStyles.getPropertyValue(computedStyleKey)
          }
        }

        const rect = node.getBoundingClientRect()
        for (let rectKey in rect) {
          styles['$' + rectKey] = rect[rectKey]
        }

        map[key] = styles
        node = xpath.iterateNext()
      }
      return map
    }

    return getCssom()
  }
}

const logDiff = ({ kind, path, lhs, rhs }) => {
  let type = null
  switch (kind) {
    case 'E':
      type = 'Edit'
      break
  }


  console.log('======')
  console.log('Type:', type)
  console.log('Selector:', atob(path[0]))
  console.log('Property:', path[1])
  console.log('Original value:', lhs)
  console.log('Changed value', rhs)
  console.log('======')
}

page.open(url1, () => {
  const cssom1 = page.evaluate(cssdom())
  page.open(url2, () => {
    const cssom2 = page.evaluate(cssdom())
    const diffs = diff(cssom1, cssom2)
    diffs.forEach(logDiff)
    phantom.exit()
  })
})