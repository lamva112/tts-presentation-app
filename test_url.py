from urllib.parse import quote; encoded_url = quote('https://mcbotstorage234234.blob.core.windows.net/uploadpptx/023b6987-5167-42b1-a714-9425343923b1_011e6b0d-f3aa-45c7-bdfb-5d7ccbfb7f97_CMCG_AVD-PoC-report%201.pptx?sp=racwdyti&st=2025-04-21T17:59:29Z&se=2025-04-30T01:59:29Z&spr=https&sv=2024-11-04&sr=b&sig=0JVneIYc2sqVxfDuc7e6SH1MYA3yAwimuWA1pfJ95O4%3D', safe=''); 
print("https://view.officeapps.live.com/op/embed.aspx?src=" + encoded_url)

print("https://view.officeapps.live.com/op/view.aspx?src=" + encoded_url)