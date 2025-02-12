export const pagination = async({page = 1,limit = 4,model,body = {isDeleted:{$exists:false}},populate = []})=>{
    let myPAge = parseInt(page) || 1;
    if (myPAge < 1) {
        myPAge = 1;
    }
    const skip = (myPAge - 1) * limit;
    // get all post
    const data = await model.find(body).limit(limit).skip(skip).populate(populate)
    return {data,myPAge}
}