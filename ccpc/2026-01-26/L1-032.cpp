// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805100684361728
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    char ch;
    string str;
    cin >> n >> ch;
    cin.get();
    getline(cin, str);
    if (str.size() < n)
        cout << string(n - str.size(), ch);
    for (int i = max(0, (int)str.size() - n); i < str.size(); ++i)
        cout << str[i];
}
