// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805099426070528
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int y, n;
    cin >> y >> n;
    int cnt = 0;

    auto check = [&](int year, int num) -> bool
    {
        string str = to_string(year);
        if (str.size() < 4)
            str += '0';
        sort(all(str));
        str.erase(unique(all(str)), str.end());
        return str.size() != num;
    };

    while (check(y, n))
        ++cnt,++y;
    cout << cnt << " " << setw(4) << setfill('0') << y;
}
