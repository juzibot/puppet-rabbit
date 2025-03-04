import { PuppetRabbit } from '../src/mod.js'
import * as PUPPET from '@juzi/wechaty-puppet'

const puppet = new PuppetRabbit({
  token: 'puppet_ttbunny_test',
  mqUri: '',
})

puppet.on('login', onLogin).on('loginUrl', onLoginUrl)

puppet.start()

async function onLoginUrl(payload: PUPPET.payloads.EventLoginUrl) {
  console.info(`login url: ${payload.url}`)
}

async function onLogin(payload: PUPPET.payloads.EventLogin) {
  console.info(`${payload.contactId} login`)

  const contactPayload = await puppet.contactPayload(payload.contactId)
  console.info(`contact payload: ${JSON.stringify(contactPayload)}`)

  const pagination = {} as any
  const list: string[] = []
  while (true) {
    const response = await puppet.postSearch(
      {
        rootId: '',
      },
      pagination,
    )
    list.push(...response.response)
    if (!response.nextPageToken) {
      break
    } else {
      pagination.pageToken = response.nextPageToken
    }
  }
  console.log(list)
  const postPayload = await puppet.postPayload(list[0])
  console.log(postPayload)

  const paginationComment = {} as any
  const commentList: string[] = []
  while (true) {
    const response = await puppet.postSearch(
      {
        rootId: postPayload.id!,
      },
      paginationComment,
    )
    commentList.push(...response.response)
    if (!response.nextPageToken) {
      break
    } else {
      paginationComment.pageToken = response.nextPageToken
    }
  }
  console.log('comment')
  console.log(commentList)

  const response = await puppet.postSearch(
    {
      rootId: postPayload.id!,
      parentId: '7438797747752338232',
    },
    paginationComment,
  )
  console.log(response.response)
  const commentPayload = (await puppet.postPayload(
    response.response[0],
  )) as PUPPET.payloads.PostServer
  console.log(commentPayload)

  const commenterPayload = await puppet.contactPayload(commentPayload.contactId)
  console.log(commenterPayload)
}
