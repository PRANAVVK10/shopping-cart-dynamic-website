const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=(callback)=>{
    const url='mongodb://localhost:27017'
    const dbname='cart'

    mongoClient.connect(url,(err,data)=>{
        if(err)
        return callback(err)
        else
        state.db=data.db(dbname)
        callback()
    })
}
module.exports.get=()=>{
    return state.db
}