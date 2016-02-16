import webpage from 'webpage'
import { diff } from 'deep-diff'

const page = webpage.create()
const url1 = 'https://github.com/chrisronline/angular-float-labels'
const url2 = 'https://github.com/chrisronline/angular-promise-cache'

const cssdom = () => {
  return () => {

    const getId = node => {
      let cls = '';

      if (node.className) {
        if (typeof node.className === 'string') {
          cls = '.' + node.className.replace(' ', ':');
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
        "/html/body//*[not(self::style) and not(self::script) and not(self::link) and not(self::noscript)]",
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

        map[key] = styles
        node = xpath.iterateNext()
      }
      return map
    }

    return getCssom()
  }
}

page.open(url1, () => {
  const cssom1 = page.evaluate(cssdom())
  page.open(url2, () => {
    const cssom2 = page.evaluate(cssdom())
    const diffs = diff(cssom1, cssom2)
    diffs.forEach(diff => {
      console.log(diff.kind, diff.path.map(p => atob(p)).join(','), diff.lhs, diff.rhs)
    })
    phantom.exit()
  })
})