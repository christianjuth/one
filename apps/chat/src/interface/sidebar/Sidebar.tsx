import { memo } from 'react'
import { H3, SizableText, Spacer, XStack, YStack } from 'tamagui'
import { useFriends } from '~/state/useQuery'
import { SidebarServerChannelsList } from './SidebarServerChannelsList'
import { SidebarServersRow } from './SidebarServersRow'
import { ListTitle } from '../lists/ListTitle'
import { ButtonSimple } from '../ButtonSimple'
import { Plus } from '@tamagui/lucide-icons'
import { dialogAddFriend } from '../dialogs/actions'

export const Sidebar = memo(() => {
  return (
    <YStack ov="hidden" f={10} mih={200} maw={250} miw={250} gap="$2">
      <SidebarServersRow />

      <SidebarServerChannelsList />

      <YStack btw={1} bc="$background025" py="$2" mt="auto" mah={200}>
        <SidebarQuickList />
      </YStack>
    </YStack>
  )
})

const SidebarQuickList = () => {
  const friends = useFriends()

  return (
    <>
      <ListTitle
        icon={
          <ButtonSimple
            tooltip="Add friend"
            onPress={() => {
              dialogAddFriend()
            }}
          >
            <Plus size={16} o={0.5} />
          </ButtonSimple>
        }
        iconAfter
      >
        Friends
      </ListTitle>
      <Spacer size="$2" />

      {friends.map((friend) => {
        return <RoomItem key={friend.id} name={friend.username || friend.name} />
      })}
    </>
  )
}

const SubTitle = (props: { children: any }) => {
  return (
    <H3 cur="default" userSelect="none" px="$2.5" py="$1.5" o={0.4} size="$2">
      {props.children}
    </H3>
  )
}

const RoomItem = (props: { name: any; active?: boolean }) => {
  return (
    <XStack
      px="$2.5"
      py="$1.5"
      userSelect="none"
      cur="default"
      hoverStyle={{
        bg: '$background025',
      }}
      {...(props.active && {
        bg: '$background05',
        hoverStyle: {
          bg: '$background05',
        },
      })}
    >
      <SizableText fow="500" cur="default">
        {props.name}
      </SizableText>
    </XStack>
  )
}
