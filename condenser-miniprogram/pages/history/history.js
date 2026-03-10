const api = require('../../utils/request')
const auth = require('../../utils/auth')

Page({
  data: {
    list: [],
    page: 1,
    size: 10,
    hasMore: true,
    loading: false,
    refreshing: false,
    keyword: '',
    showActionSheet: false,
    selectedItem: null
  },

  onLoad() {
    if (!auth.checkAuth()) return
    this.loadData()
  },

  onShow() {
    // 每次显示时刷新列表
    if (this.data.list.length > 0) {
      this.setData({ page: 1, list: [], hasMore: true })
      this.loadData()
    }
  },

  loadData() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    api.getQuoteList(this.data.page, this.data.size).then(res => {
      const records = res.records || res.list || res || []
      const total = res.total || records.length

      // 格式化时间
      const formattedRecords = records.map(item => ({
        ...item,
        createTime: this.formatTime(item.createTime),
        totalPrice: parseFloat(item.totalPrice || 0).toFixed(2)
      }))

      const newList = this.data.page === 1 ? formattedRecords : [...this.data.list, ...formattedRecords]
      const hasMore = newList.length < total

      this.setData({
        list: newList,
        hasMore,
        loading: false,
        refreshing: false,
        page: this.data.page + 1
      })
    }).catch(err => {
      console.error('加载历史报价失败', err)
      this.setData({ loading: false, refreshing: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    // 处理各种时间格式
    const date = new Date(timeStr.replace(/-/g, '/'))
    if (isNaN(date.getTime())) return timeStr

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  onRefresh() {
    this.setData({ refreshing: true, page: 1, list: [], hasMore: true })
    this.loadData()
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData()
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  doSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find(x => x.id === id)
    if (item) {
      this.setData({ showActionSheet: true, selectedItem: item })
    }
  },

  hideActionSheet() {
    this.setData({ showActionSheet: false, selectedItem: null })
  },

  exportExcel() {
    const item = this.data.selectedItem
    if (!item) return

    this.hideActionSheet()

    // 使用 fullJsonData 重新导出
    let exportData = item.fullJsonData
    if (typeof exportData === 'string') {
      try {
        exportData = JSON.parse(exportData)
      } catch (e) {
        wx.showToast({ title: '数据格式错误', icon: 'none' })
        return
      }
    }

    if (!exportData) {
      wx.showToast({ title: '无报价数据', icon: 'none' })
      return
    }

    wx.showLoading({ title: '生成中...' })

    api.downloadQuoteExcel(exportData).then(filePath => {
      wx.hideLoading()
      wx.openDocument({
        filePath: filePath,
        fileType: 'xlsx',
        success: () => {
          wx.showToast({ title: '导出成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '打开失败', icon: 'none' })
        }
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('导出失败', err)
      wx.showToast({ title: '导出失败', icon: 'none' })
    })
  },

  deleteQuote() {
    const item = this.data.selectedItem
    if (!item) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除报价单 ${item.quoteNo} 吗？`,
      success: res => {
        if (res.confirm) {
          this.hideActionSheet()
          wx.showLoading({ title: '删除中...' })

          api.deleteQuote(item.id).then(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            // 刷新列表
            this.setData({ page: 1, list: [], hasMore: true })
            this.loadData()
          }).catch(err => {
            wx.hideLoading()
            console.error('删除失败', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
