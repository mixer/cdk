layout
================

Flexbox-based layout engine

## Specification

Beam UI's layout engine is a direct port of the flexbox engine used in Angular Material 1,
with the only difference being that we'll use classes directly instead of using a directive to add classes.

## Layout classes
The layout engine is heavily inspired by [Angular Material's implementation](https://material.angularjs.org/latest/layout/introduction)

### Containers:

**Create a container**  
Create a flex container with the `layout-` class

| Class                           | Effect                                              |
|---------------------------------|-----------------------------------------------------|
| layout-row                      | Create flex container with specified flex-direction |
| layout-column                   |                                                     |
| layout-row-reverse              |                                                     |
| layout-column-reverse           |                                                     |

**Determine alignment**  
Determine how children will align within the container

| Class                            | Effect                                              |
|----------------------------------|-----------------------------------------------------|
| layout-align-${align}-${justify} | `${align}` says how the children will be aligned in the layout's direction, and `${justify}` says how the children will be aligned perpendicular to the layout's direction. |

Available values for `${align}` are
- none
- start (default)
- center
- end
- space-around
- space-between

Available values for `${justify}` are
- none
- start 
- center
- end
- stretch (default)

**Extras**

| Class                           | Effect                                              |
|---------------------------------|-----------------------------------------------------|
| layout-margin                   | Adds margin around each flex child. It also adds a margin to the layout container itself |
| layout-padding                  | Adds padding inside each flex child. It also adds padding to the layout container itself |
| layout-fill                     | Forces the layout element to fill its parent container |
| layout-wrap                     | Allows flex children to wrap within the container if the elements use more than 100% |

### Children:

To customize the size and position of elements in a layout container, 
use the `flex-`, `flex-order-`, and `flex-offset-` classes on the container's child elements:

| Class                 | Effect                                                               |
|-----------------------|----------------------------------------------------------------------|
| flex-[$percentage]    | The element will stretch to the percentage of available space matching the value. `$percentage` goes from 0-100. Restricted to incremets of 5, 33 and 66 |
| flex                  | Element will flex (grow or shrink). Same as `flex-0`                 |
| flex-none             | Will not grow or shrink. Sized based on its width and height values  |
| flex-initial          | Will shrink as needed. Starts with a size based on its width and height values |
| flex-auto             | Will grow and shrink as needed. Starts with a size based on its width and height values |
| flex-grow             | Will grow and shrink as needed. Starts with a size of 100%. Same as flex="100" |
| flex-nogrow           | Will shrink as needed, but won't grow. Starts with a size based on its width and height values |
| flex-noshrink         | Will grow as needed, but won't shrink. Starts with a size based on its width and height values |
| flex-order-{$order}   | Set the element's order position within the layout container. Any integer value from -20 to 20 is accepted for `$order`|
| flex-offset-{$offset} | Set the element's offset percentage within the layout container. Values for `$offset` must be multiples of 5 or 33 / 66 |

### Responsiveness:

All previously explored classes can be modified with responsive prefixes. For example,
`layout-xs-row` will only apply it's rule below 600px width.  

<< Refer to this responsive chart TODO >>

Use the following classes to conditionally hide and show elements responsively simiarly to `ng-show` and `ng-hide`:

| Class                           |
|---------------------------------|
| hide-{$breakpoint}              |
| show-{$breakpoint}              |

## Helper classes

| Category         | Class                           | Effect                                    |
|------------------|---------------------------------|-------------------------------------------|
| Margins          | bui-margin-top-1x               | Modifiers available up to 8x. Base is 8px |
|                  | bui-margin-left-1x              |                                           |
|                  | bui-margin-right-1x             |                                           |
|                  | bui-margin-bottom-1x            |                                           |
|                  | bui-margin-vertical-1x          |                                           |
|                  | bui-margin-horizontal-1x        |                                           |
|                  | bui-margin-all-1x               |                                           |
|                  | bui-margin-auto                 | Will set margin to auto left and right    |
| Paddings         | bui-padding-top-1x              | Modifiers available up to 8x. Base is 8px |
|                  | bui-padding-left-1x             |                                           |
|                  | bui-padding-right-1x            |                                           |
|                  | bui-padding-bottom-1x           |                                           |
|                  | bui-padding-vertical-1x         |                                           |
|                  | bui-padding-horizontal-1x       |                                           |
|                  | bui-padding-all-1x              |                                           |
