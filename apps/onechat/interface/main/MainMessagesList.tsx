import { IndentIncrease, MoreVertical, Reply } from '@tamagui/lucide-icons'
import { useEffect, useRef } from 'react'
import {
  Button,
  type ButtonProps,
  ScrollView,
  Separator,
  SizableText,
  type TamaguiElement,
  TooltipSimple,
  XGroup,
  XStack,
  YStack,
} from 'tamagui'
import type { Channel, Message, Reaction, Thread, User } from '~/config/zero/schema'
import { useAuth } from '~/features/auth/useAuth'
import { useCurrentChannel, useCurrentMessages } from '~/features/state/queries/useServer'
import { currentUser, updateUserCurrentChannel } from '~/features/state/queries/useUserState'
import { randomID } from '~/features/state/randomID'
import { mutate, useQuery } from '~/features/state/zero'
import { Avatar } from '~/interface/Avatar'

export const MainMessagesList = () => {
  const channel = useCurrentChannel()
  const messages = useCurrentMessages() || []
  const { user } = useAuth()
  const scrollViewRef = useRef<TamaguiElement>(null)

  useEffect(() => {
    if (scrollViewRef.current instanceof HTMLElement) {
      scrollViewRef.current.scrollTop = 100_000
    }
  }, [messages])

  return (
    <YStack ov="hidden" f={1}>
      <YStack f={100} />
      <ScrollView ref={scrollViewRef as any}>
        <YStack pt="$10">
          {user
            ? messages.map((message, index) => {
                const lastMessage = messages[index - 1]
                return (
                  <MessageItem
                    hideUser={lastMessage?.senderId === message.senderId}
                    channel={channel}
                    key={message.id}
                    message={message}
                    user={user as any}
                  />
                )
              })
            : null}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

const MessageItem = ({
  message,
  channel,
  user,
  hideUser,
}: {
  message: Message & { reactions: Reaction[]; thread: Thread[] }
  channel: Channel
  user: User
  hideUser?: boolean
}) => {
  const [topReactions] = useQuery((q) => q.reaction.limit(3).orderBy('createdAt', 'desc'))
  const [thread] = message.thread || []
  const hasThread = !!thread as boolean

  // reaction.id => count
  const reactionCounts: Record<string, number> = {}

  for (const reaction of message.reactions) {
    if (reaction.id) {
      reactionCounts[reaction.id] ||= 0
      reactionCounts[reaction.id]++
    }
  }

  return (
    <XStack
      f={1}
      gap="$3"
      py={hideUser ? '$1.5' : '$2.5'}
      px="$4"
      group="message"
      borderTopWidth={2}
      borderBottomWidth={2}
      borderColor="transparent"
      hoverStyle={{
        bg: '$background025',
      }}
      {...(hasThread && {
        borderColor: '$green5',
      })}
    >
      <XStack
        pos="absolute"
        t={-8}
        r={8}
        o={0}
        elevation="$0.5"
        br="$4"
        zi={1000}
        $group-message-hover={{ o: 1 }}
      >
        <XGroup bg="$color2">
          {topReactions.map((reaction) => {
            return <ReactionButton key={reaction.id} message={message} reaction={reaction} />
          })}

          <Separator my="$2" vertical />

          {!hasThread && (
            <TooltipSimple label="Create Thread">
              <Button
                onPress={() => {
                  if (!currentUser) {
                    console.error(`no user`)
                    return
                  }

                  mutate.thread.insert({
                    id: randomID(),
                    channelId: channel.id,
                    messageId: message.id,
                    createdAt: new Date().getTime(),
                    creatorId: currentUser.id,
                    description: '',
                    title: '',
                  })
                }}
                chromeless
                size="$2.5"
                br={0}
              >
                <IndentIncrease size={16} />
              </Button>
            </TooltipSimple>
          )}

          <TooltipSimple label="Quote Reply">
            <Button chromeless size="$2.5" br={0}>
              <Reply size={16} />
            </Button>
          </TooltipSimple>

          <Button chromeless size="$2.5">
            <MoreVertical size={16} />
          </Button>
        </XGroup>
      </XStack>

      <XStack w={32}>{!hideUser && <Avatar image={user.image} />}</XStack>

      <YStack f={1} gap="$1">
        {!hideUser && (
          <SizableText o={0.5} mb={-4} fow="bold">
            {user.username || user.name}
          </SizableText>
        )}

        <SizableText f={1} ov="hidden">
          {message.content}
        </SizableText>

        {thread && (
          <YStack>
            <XStack
              bg="$color2"
              als="flex-start"
              px="$2"
              br="$8"
              ai="center"
              gap="$2"
              hoverStyle={{
                bg: '$color5',
              }}
              onPress={() => {
                updateUserCurrentChannel({
                  openedThreadId: thread.id,
                })
              }}
            >
              <IndentIncrease o={0.5} size={16} />
              <SizableText cur="default" o={0.5} size="$3">
                This is a thread
              </SizableText>
            </XStack>
          </YStack>
        )}

        <XStack>
          {Object.entries(reactionCounts).map(([id, count]) => {
            const reaction = message.reactions.find((x) => x.id === id)
            if (!reaction) {
              return null
            }
            return (
              <ReactionButton
                key={reaction.id}
                count={count}
                message={message}
                reaction={reaction}
              />
            )
          })}
        </XStack>
      </YStack>
    </XStack>
  )
}

const ReactionButton = ({
  reaction,
  message,
  count,
  ...rest
}: ButtonProps & {
  count?: number
  message: Message
  reaction: Pick<Reaction, 'id' | 'value'>
}) => {
  const { user } = useAuth()

  return (
    <Button
      chromeless
      size="$2.5"
      {...rest}
      onPress={() => {
        if (!user) {
          return
        }

        mutate.messageReaction.insert({
          createdAt: new Date().getTime(),
          messageId: message.id,
          reactionId: reaction.id,
          userId: user.id,
        })
      }}
    >
      {typeof count === 'number' && (
        <SizableText
          pos="absolute"
          t={-5}
          br="$10"
          r={-5}
          bg="$color5"
          w={20}
          h={20}
          size="$1"
          lh={20}
          ai="center"
          jc="center"
        >
          {count}
        </SizableText>
      )}
      {reaction.value}
    </Button>
  )
}
