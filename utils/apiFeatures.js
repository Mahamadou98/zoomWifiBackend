class APIFeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedField = [
      'page',
      'limit',
      'sort',
      'fields',
      'search',
      'searchFields',
      'minBalance',
      'maxBalance',
    ]
    excludedField.forEach(el => delete queryObj[el])

    // Handle balance range filtering
    if (this.queryString.minBalance || this.queryString.maxBalance) {
      const minBalance = parseInt(this.queryString.minBalance, 10) || 0
      const maxBalance = parseInt(this.queryString.maxBalance, 10) || Infinity

      queryObj.balance = {
        $gte: minBalance,
        $lte: maxBalance,
      }
    }

    // Handle text search if search parameter exists
    if (this.queryString.search && this.queryString.searchFields) {
      const searchFields = this.queryString.searchFields.split(',')
      const searchValue = this.queryString.search

      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: { $regex: searchValue, $options: 'i' },
        })),
      }

      this.query = this.query.find({
        $and: [searchQuery, queryObj],
      })
    } else {
      this.query = this.query.find(queryObj)
    }

    return this
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }
    return this
  }
  limitField() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }
    return this
  }

  paginate() {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 100
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)

    return this
  }
}

module.exports = APIFeatures
