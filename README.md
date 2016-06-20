# postcss-selectorcleanse

Clean up of CSS selectors. It is adviced to run this before cssnano.

## Remove specified selectors/rules

- default behaviour

Comes with three preset options.

* desktop
* tablet
* smartphone

#### desktop

Will remove the nesting .desktop classes

input example
  .element {
    width:120px;
  }
  .desktop .element {
    width:360px;
  }

output example
  .element {
    width:120px;
  }
  .element {
    width:360px;
  }

In this plugin we remove the .desktop "prefix"

### usage

Parse

  require('postcss-selectorcleanse')({      
      cleanser: 'smartphone'
  })

  require('postcss-selectorcleanse')({
      subset: false,
      selectors: {
          critical : [
              { selector: '.critical', type: 'keep' },
              { selector: '.jimmyjam', type: 'keep' }
          ]
      }
  }),

## Keep specified selectors/rules

if subset is set to true, we will only keep the specified css classes, these can be specified as an array or as objects in an array
if an options object is parsed without a cleanser specified, the first selectors object will be used as the cleanser

### usage

array

  require('postcss-selectorcleanse')({
    subset: true,
    selectors: {
      icons: [
        ".fa",
        ".fa-circle-o-notch"
      ]    
    }
  })

object

  require('postcss-selectorcleanse')({
    subset: true,
    selectors: {
      icons: [
        { selector: ".fa", type: "keep" },
        { selector: ".fa", type: "keep" }
      ]
    }
  })


# TODO
