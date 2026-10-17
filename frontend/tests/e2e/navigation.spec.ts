import {test,expect} from "@playwright/test";
test("landing explains the product and links into the real application",async({page})=>{
 await page.goto("/");
 await expect(page.getByText("Code can pass tests.")).toBeVisible();
 await page.getByRole("link",{name:/Open workbench/i}).click();
 await expect(page).toHaveURL(/dashboard/);
 await expect(page.getByRole("heading",{name:"Overview"})).toBeVisible();
});
test("all six console pages render without wallet or backend",async({page})=>{
 for(const [path,title] of [["/projects","Projects"],["/suites","Test suites"],["/runner","Test runner"],["/results","Results explorer"],["/registry","Certification registry"]] as const){
  await page.goto(path);
  await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
 }
});
