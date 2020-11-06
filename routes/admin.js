const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helper')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    
    res.render('admin/view-products',{products,admin:true})
  })
  
  
  
});
router.get('/add-products',(req,res)=>{
  res.render('admin/add-products',{admin:true})
})
router.post('/add-products',(req,res)=>{
  
  productHelper.addProducts(req.body,(id)=>{
  
   let image=req.files.image
   image.mv('./public/product-images/'+id+'.jpg',(err)=>{
     if(!err)
     res.render('admin/add-products',{admin:true})
     else
     console.log(err);
   })
   
  })

})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelper.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-products',{product,admin:true})
})
router.post('/edit-products/:id',(req,res)=>{
  let id=req.params.id
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
})


module.exports = router;
