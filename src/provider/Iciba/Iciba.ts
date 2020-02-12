import querystring from 'querystring'

import { got } from '~/util/gmapi'
import copy from '~/util/copy'

import AbstractTranslateProvider from '../AbstractTranslateProvider'
import IcibaContainer from './container/IcibaContainer.vue'
import containerData from './containerData'

import { PROVIDER } from '~/constants/constant'

class IcibaTranslateProvider extends AbstractTranslateProvider {
  public uniqName = PROVIDER.ICIBA
  public containerComponentClass = IcibaContainer
  public settingDescriptor = []

  public async translate(word: string) {
    /*
    https://www.iciba.com/index.php?
    callback=jQuery190044530474284668253_1524231993263
    a=getWordMean
    c=search
    list=1%2C2%2C3%2C4%2C5%2C8%2C9%2C10%2C12%2C13%2C14%2C15%2C18%2C21%2C22%2C24%2C3003%2C3004%2C3005
    word=select
    _=1524231993264
    */
    const apiUrlBase = 'https://www.iciba.com/index.php?'
    const query = {
      callback: 'callbackFnName',
      a: 'getWordMean', // action ?
      c: 'search',
      // 可能是请求的数据列表
      // list: [1, 2, 3, 4, 5, 8, 9, 10, 12, 13, 14, 15, 18, 21, 22, 24, 3003, 3004, 3005]
      //   .join(','),
      list: [1].join(','),
      word,
      _: new Date().getTime(),
    }
    const apiUrl = `${apiUrlBase}${querystring.stringify(query)}`

    const response = await got({
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6',
        'Cache-Control': 'no-cache',
        'Host': 'www.iciba.com',
        'Pragma': 'no-cache',
        'Referer': 'https://www.iciba.com',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': window.navigator.userAgent,
      },
      url: apiUrl,
      timeout: 5000,
    })
    const content = response.responseText
    const contentMatch = /callbackFnName\((.*)\)/.exec(content)
    if (!contentMatch) {
      return Promise.reject(new Error('数据错误！'))
    }
    const resultJson = JSON.parse(contentMatch[1])
    const result = resultJson

    // fix iciba api typo
    if ('baesInfo' in result) {
      result.baseInfo = result.baesInfo
      delete result.baesInfo
    }
    if ('bidce' in result) {
      result.bidec = result.bidce
      delete result.bidce
    }

    if (result.errno !== 0) {
      throw new Error(result.errmsg)
    }

    // dev only check
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line
      const check = require('./check').default
      check(result, word)
    }

    return () => {
      containerData.data = copy(result)
    }
  }
}

export default new IcibaTranslateProvider()
