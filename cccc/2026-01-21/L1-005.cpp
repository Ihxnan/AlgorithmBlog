// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805140211482624
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    map<int, pll> hash;
    ll id;
    int a, b;
    for (int i = 0; i < n; ++i)
    {
        cin >> id >> a >> b;
        hash[a] = {id, b};
    }
    cin >> n;
    for (int i = 0; i < n; ++i)
    {
        cin >> a;
        cout << hash[a].first << ' ' << hash[a].second << endl;
    }
}
