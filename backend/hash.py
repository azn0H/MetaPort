from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sem dej své nové čisté heslo
heslo = "AwMTNjOyN5KHkQgv95Sh7z149oQ8YQhZ0Kjfey0OoqbLYKOs43AnfaPXJiN2jclSA8m9sQ6j2u7w==" 

hash_hesla = pwd_context.hash(heslo)
print(hash_hesla)