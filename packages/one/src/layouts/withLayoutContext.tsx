import type { EventMapBase, NavigationState } from '@react-navigation/native'
import React from 'react'
import { useContextKey } from '../router/Route'
import type { PickPartial } from '../types'
import { useSortedScreens, type ScreenProps } from '../router/useScreens'
import { Screen } from '../views/Screen'
import { withStaticProperties } from '../utils/withStaticProperties'

export function useFilterScreenChildren(
  children: React.ReactNode,
  {
    isCustomNavigator,
    contextKey,
  }: {
    isCustomNavigator?: boolean
    /** Used for sending developer hints */
    contextKey?: string
  } = {}
) {
  return React.useMemo(() => {
    const customChildren: any[] = []

    const screens = React.Children.map(children, (child) => {
      if (React.isValidElement(child) && child && child.type === Screen) {
        if (!child.props.name) {
          throw new Error(
            `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
          )
        }
        if (process.env.NODE_ENV !== 'production') {
          if (['children', 'component', 'getComponent'].some((key) => key in child.props)) {
            throw new Error(
              `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
            )
          }
        }
        return child.props
      }

      if (isCustomNavigator) {
        customChildren.push(child)
      } else {
        console.warn(
          `Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`
        )
      }
    })?.filter(Boolean)

    // Add an assertion for development
    if (process.env.NODE_ENV !== 'production') {
      // Assert if names are not unique
      const names = screens?.map((screen) => screen.name)
      if (names && new Set(names).size !== names.length) {
        throw new Error('Screen names must be unique: ' + names)
      }
    }

    return {
      screens,
      children: customChildren,
    }
  }, [children, contextKey, isCustomNavigator])
}

/** Return a navigator that automatically injects matched routes and renders nothing when there are no children. Return type with children prop optional */
export function withLayoutContext<
  TOptions extends object,
  T extends React.ComponentType<any>,
  State extends NavigationState,
  EventMap extends EventMapBase,
>(
  Nav: T,
  processor?: (
    options: ScreenProps<TOptions, State, EventMap>[]
  ) => ScreenProps<TOptions, State, EventMap>[],
  options?: { props: any }
) {
  return withStaticProperties(
    React.forwardRef<unknown, PickPartial<React.ComponentProps<T>, 'children'>>((propsIn, ref) => {
      const { children, ...props } = propsIn as React.ComponentProps<T>
      const contextKey = useContextKey()
      const { screens } = useFilterScreenChildren(children, {
        contextKey,
      })

      const processed = processor ? processor(screens ?? []) : screens
      const sorted = useSortedScreens(processed ?? [], {
        onlyMatching: true,
      })

      // Prevent throwing an error when there are no screens.
      if (!sorted.length) {
        return null
      }

      return (
        <Nav {...options?.props} {...props} id={contextKey} ref={ref}>
          {sorted}
        </Nav>
      )
    }),
    {
      Screen,
    }
  )
}
